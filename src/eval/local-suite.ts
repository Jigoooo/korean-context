import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  posix,
  relative,
  resolve,
  win32,
} from "node:path";

import { z } from "zod";

import { domains, surfaces } from "./types.js";
import type { V02Mode } from "./v02-result-schema.js";

const LocalSourceCaseSchema = z
  .object({
    id: z.string().regex(/^local-\d{3}$/u),
    relativePath: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
    surface: z.enum(surfaces),
    domain: z.enum(domains),
    instruction: z.string().min(1),
    projectVocabulary: z
      .object({
        preferred: z.array(z.string().min(1)),
        accepted: z.array(z.string().min(1)),
        forbidden: z.array(z.string().min(1)),
      })
      .strict(),
    protectedTokens: z.array(z.string().min(1)),
    repeatCount: z.union([z.literal(1), z.literal(3)]),
  })
  .strict()
  .refine((item) => item.endLine >= item.startLine, {
    message: "endLine must be greater than or equal to startLine",
    path: ["endLine"],
  });

const LocalSourceManifestSchema = z
  .object({
    repositoryRoot: z.string().min(1),
    baseRef: z.string().min(1),
    cases: z.array(LocalSourceCaseSchema).min(1),
  })
  .strict()
  .superRefine((manifest, context) => {
    const ids = new Set<string>();
    for (const [index, item] of manifest.cases.entries()) {
      if (ids.has(item.id)) {
        context.addIssue({
          code: "custom",
          path: ["cases", index, "id"],
          message: `Duplicate local case id: ${item.id}`,
        });
      }
      ids.add(item.id);
    }
  });

export type LocalSourceCase = z.infer<typeof LocalSourceCaseSchema>;
export type LocalSourceManifest = z.infer<typeof LocalSourceManifestSchema>;

export type LocalAuditOptions = {
  manifestPath: string;
  mode: V02Mode;
  model: string;
  reasoningEffort: string;
  outputPath: string;
};

const pathEscapes = (root: string, candidate: string) => {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot.startsWith("..") ||
    isAbsolute(pathFromRoot) ||
    pathFromRoot === ""
  );
};

const isAnyAbsolutePath = (path: string) =>
  isAbsolute(path) || posix.isAbsolute(path) || win32.isAbsolute(path);

const localSourcePath = async (
  manifest: LocalSourceManifest,
  item: LocalSourceCase,
) => {
  if (isAnyAbsolutePath(item.relativePath)) {
    throw new Error("Local source path escapes repository root");
  }
  const root = await realpath(manifest.repositoryRoot);
  const candidate = resolve(root, item.relativePath);
  if (pathEscapes(root, candidate)) {
    throw new Error("Local source path escapes repository root");
  }

  let resolvedCandidate: string;
  try {
    resolvedCandidate = await realpath(candidate);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Local source file does not exist: ${item.relativePath}`,
        {
          cause: error,
        },
      );
    }
    throw error;
  }
  if (pathEscapes(root, resolvedCandidate)) {
    throw new Error("Local source path escapes repository root");
  }
  if (!(await stat(resolvedCandidate)).isFile()) {
    throw new Error(`Local source is not a file: ${item.relativePath}`);
  }
  return resolvedCandidate;
};

const readTextFile = async (path: string) => {
  const contents = await readFile(path);
  if (contents.includes(0)) {
    throw new Error("Local source file must be UTF-8 text");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(contents);
  } catch (error) {
    throw new Error("Local source file must be UTF-8 text", { cause: error });
  }
};

export async function loadLocalSourceManifest(
  path: string,
): Promise<LocalSourceManifest> {
  const resolvedPath = resolve(path);
  const manifest = LocalSourceManifestSchema.parse(
    JSON.parse(await readFile(resolvedPath, "utf8")) as unknown,
  );
  return {
    ...manifest,
    repositoryRoot: resolve(dirname(resolvedPath), manifest.repositoryRoot),
  };
}

export async function readLocalSourceContext(
  manifest: LocalSourceManifest,
  item: LocalSourceCase,
): Promise<string> {
  const path = await localSourcePath(manifest, item);
  const lines = (await readTextFile(path)).split(/\r?\n/u);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  if (item.endLine > lines.length) {
    throw new Error(`Local source line range exceeds file: ${item.id}`);
  }
  return lines.slice(item.startLine - 1, item.endLine).join("\n");
}

export async function captureLocalSourceHashes(
  manifest: LocalSourceManifest,
): Promise<Record<string, string>> {
  const paths = [
    ...new Set(manifest.cases.map((item) => item.relativePath)),
  ].sort();
  const hashes: Record<string, string> = {};
  for (const relativePath of paths) {
    const matching = manifest.cases.find(
      (item) => item.relativePath === relativePath,
    );
    if (!matching) {
      continue;
    }
    const path = await localSourcePath(manifest, matching);
    hashes[relativePath] = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  }
  return hashes;
}

export function assertLocalSourceHashesUnchanged(
  before: Record<string, string>,
  after: Record<string, string>,
): void {
  const paths = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort();
  for (const path of paths) {
    if (before[path] !== after[path]) {
      throw new Error(`Local source changed during audit: ${path}`);
    }
  }
}

export function parseLocalAuditArguments(
  args: string[],
  currentDirectory: string,
): LocalAuditOptions {
  let mode: V02Mode | undefined;
  let model = "gpt-5.6-sol";
  let reasoningEffort = "xhigh";
  let manifest = ".local/evals/v0.2/source-manifest.json";
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (
      ![
        "--manifest",
        "--mode",
        "--model",
        "--reasoning-effort",
        "--output",
      ].includes(option ?? "")
    ) {
      throw new Error(`Unknown option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}`);
    }
    switch (option) {
      case "--manifest":
        manifest = value;
        break;
      case "--mode":
        if (value !== "baseline" && value !== "explicit") {
          throw new Error(`Unsupported mode: ${value}`);
        }
        mode = value;
        break;
      case "--model":
        model = value;
        break;
      case "--reasoning-effort":
        reasoningEffort = value;
        break;
      case "--output":
        output = value;
        break;
    }
    index += 1;
  }
  if (!mode) {
    throw new Error("Missing required --mode");
  }

  const root = resolve(currentDirectory);
  const localRoot = resolve(root, ".local");
  const outputPath = resolve(
    root,
    output ?? `.local/evals/v0.2/${mode}/runs.jsonl`,
  );
  if (pathEscapes(localRoot, outputPath)) {
    throw new Error("Local audit output must stay inside .local");
  }
  return {
    manifestPath: resolve(root, manifest),
    mode,
    model,
    reasoningEffort,
    outputPath,
  };
}
