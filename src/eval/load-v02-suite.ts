import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

import {
  V02EvalCaseSchema,
  V02SuiteManifestSchema,
  type V02EvalCase,
  type V02ScenarioType,
  type V02SuiteManifest,
} from "./v02-schema.js";

const assertContainedPath = (directory: string, path: string) => {
  const relativePath = relative(directory, path);
  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    resolve(directory, relativePath) !== path
  ) {
    throw new Error(`Suite path escapes manifest directory: ${path}`);
  }
};

export async function loadV02CaseFile(
  path: string,
  scenarioType: V02ScenarioType,
): Promise<V02EvalCase[]> {
  const contents = await readFile(path, "utf8");
  const lines = contents.split(/\r?\n/u).filter((line) => line.trim() !== "");
  const cases: V02EvalCase[] = [];

  for (const [index, line] of lines.entries()) {
    let input: unknown;
    try {
      input = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON at ${path}:${index + 1}`);
    }

    const evalCase = V02EvalCaseSchema.parse(input);
    if (evalCase.scenarioType !== scenarioType) {
      throw new Error(
        `Case ${evalCase.id} has scenario ${evalCase.scenarioType} in ${basename(path)}`,
      );
    }
    cases.push(evalCase);
  }

  return cases;
}

export async function loadV02Suite(manifestPath: string): Promise<{
  manifest: V02SuiteManifest;
  cases: V02EvalCase[];
}> {
  const resolvedManifestPath = resolve(manifestPath);
  const directory = dirname(resolvedManifestPath);
  const manifest = V02SuiteManifestSchema.parse(
    JSON.parse(await readFile(resolvedManifestPath, "utf8")) as unknown,
  );
  const declaredFiles = new Set(manifest.files.map((file) => file.path));

  if (declaredFiles.size !== manifest.files.length) {
    throw new Error("Duplicate file declaration in v0.2 manifest");
  }

  const directoryEntries = await readdir(directory, { withFileTypes: true });
  const undeclared = directoryEntries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".jsonl") &&
        !declaredFiles.has(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
  if (undeclared[0]) {
    throw new Error(`Undeclared JSONL file: ${undeclared[0]}`);
  }

  const cases: V02EvalCase[] = [];
  const ids = new Set<string>();
  for (const file of manifest.files) {
    const path = resolve(directory, file.path);
    assertContainedPath(directory, path);
    const fileCases = await loadV02CaseFile(path, file.scenarioType);
    for (const evalCase of fileCases) {
      if (ids.has(evalCase.id)) {
        throw new Error(`Duplicate eval id: ${evalCase.id}`);
      }
      ids.add(evalCase.id);
      cases.push(evalCase);
    }
    if (fileCases.length !== file.count) {
      throw new Error(
        `${file.path} declares ${file.count} cases but contains ${fileCases.length}`,
      );
    }
  }

  if (cases.length !== manifest.totalCases) {
    throw new Error(
      `Manifest declares ${manifest.totalCases} cases but contains ${cases.length}`,
    );
  }

  const repeatedCases = cases.filter((item) => item.repeatCount === 3).length;
  if (repeatedCases !== manifest.repeatedCases) {
    throw new Error(
      `Manifest declares ${manifest.repeatedCases} repeated cases but contains ${repeatedCases}`,
    );
  }

  return { manifest, cases };
}
