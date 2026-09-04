import { isAbsolute, join, relative, resolve } from "node:path";

import { validateAutomaticCheckDefinitions } from "./hard-failures.js";
import { loadV02Suite } from "./load-v02-suite.js";
import { validatePublicV02Artifacts } from "./privacy.js";
import { loadSources } from "../research/load-sources.js";

export type ValidateV02Options = {
  root: string;
  manifestPath: string;
  sourcesPath: string;
};

export type V02ValidationSummary = {
  cases: number;
  repeated: number;
};

const readArgument = (args: string[], name: string) => {
  const index = args.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
};

export function parseValidateV02Arguments(
  args: string[],
  currentDirectory: string,
): ValidateV02Options {
  const root = resolve(currentDirectory, readArgument(args, "--root") ?? ".");
  return {
    root,
    manifestPath: resolve(
      root,
      readArgument(args, "--manifest") ?? "evals/cases/v0.2/manifest.json",
    ),
    sourcesPath: resolve(
      root,
      readArgument(args, "--sources") ?? "research/sources.yml",
    ),
  };
}
export async function validateV02Suite(
  options: ValidateV02Options,
): Promise<V02ValidationSummary> {
  const publicCasesDirectory = resolve(
    options.root,
    join("evals", "cases", "v0.2"),
  );
  const manifestPath = resolve(options.manifestPath);
  const relativeManifestPath = relative(publicCasesDirectory, manifestPath);
  if (
    relativeManifestPath.startsWith("..") ||
    isAbsolute(relativeManifestPath)
  ) {
    throw new Error(
      "Manifest path must be inside evals/cases/v0.2 under the public root",
    );
  }
  const [{ cases }, sources] = await Promise.all([
    loadV02Suite(manifestPath),
    loadSources(options.sourcesPath),
  ]);
  const knownSourceIds = new Set(sources.map((source) => source.id));

  for (const evalCase of cases) {
    validateAutomaticCheckDefinitions(evalCase);
    for (const sourceId of evalCase.sourceIds) {
      if (!knownSourceIds.has(sourceId)) {
        throw new Error(
          `Case ${evalCase.id} references unknown source ${sourceId}`,
        );
      }
    }
  }

  await validatePublicV02Artifacts(options.root);

  return {
    cases: cases.length,
    repeated: cases.filter((item) => item.repeatCount === 3).length,
  };
}
