import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import { execa } from "execa";

import { loadEvalCases } from "./load-cases.js";
import { loadV02Suite } from "./load-v02-suite.js";
import {
  appendV02Run,
  effectiveV02Runs,
  loadV02Runs,
  successfulV02RunKeys,
  v02RunKey,
} from "./run-store.js";
import {
  planLegacyAttempts,
  planV02Attempts,
  runCodexLegacyAttempt,
  runCodexV02Attempt,
  type PlannedLegacyAttempt,
  type PlannedV02Attempt,
  type V02RunExecutionContext,
} from "./v02-codex-runner.js";
import {
  V02RunManifestSchema,
  type EvaluationSuite,
  type V02EvalRun,
  type V02Mode,
  type V02RunManifest,
} from "./v02-result-schema.js";

export type RunV02Options = {
  suite: EvaluationSuite;
  mode: V02Mode;
  model: string;
  reasoningEffort: string;
  pluginVersion: string | null;
  manifestPath: string;
  fixtureDirectory: string;
  outputPath: string;
  concurrency: number;
  disabledMcpServers: string[];
  reset: boolean;
};

export type PlannedRunIdentity = {
  suite: EvaluationSuite;
  caseId: string;
  mode: V02Mode;
  attempt: number;
};

const takeValue = (args: string[], index: number, option: string): string => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
};

export function parseRunV02Arguments(
  args: string[],
  currentDirectory: string,
): RunV02Options {
  let suite: EvaluationSuite = "v0.2";
  let mode: V02Mode | undefined;
  let model = "gpt-5.6-sol";
  let reasoningEffort = "xhigh";
  let pluginVersion: string | null = null;
  let manifestPath: string | undefined;
  let fixtureDirectory: string | undefined;
  let outputPath: string | undefined;
  let concurrency = 2;
  const disabledMcpServers = new Set<string>();
  let reset = false;

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    switch (option) {
      case "--suite": {
        const value = takeValue(args, index, option);
        if (value !== "v0.2" && value !== "v0.1-regression") {
          throw new Error(`Unsupported suite: ${value}`);
        }
        suite = value;
        index += 1;
        break;
      }
      case "--mode": {
        const value = takeValue(args, index, option);
        if (value !== "baseline" && value !== "explicit") {
          throw new Error(`Unsupported mode: ${value}`);
        }
        mode = value;
        index += 1;
        break;
      }
      case "--model":
        model = takeValue(args, index, option);
        index += 1;
        break;
      case "--reasoning-effort":
        reasoningEffort = takeValue(args, index, option);
        index += 1;
        break;
      case "--plugin-version":
        pluginVersion = takeValue(args, index, option);
        index += 1;
        break;
      case "--manifest":
        manifestPath = takeValue(args, index, option);
        index += 1;
        break;
      case "--fixture":
        fixtureDirectory = takeValue(args, index, option);
        index += 1;
        break;
      case "--output":
        outputPath = takeValue(args, index, option);
        index += 1;
        break;
      case "--concurrency":
        concurrency = Number(takeValue(args, index, option));
        index += 1;
        break;
      case "--disable-mcp": {
        const value = takeValue(args, index, option);
        if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
          throw new Error(`Invalid MCP server id: ${value}`);
        }
        disabledMcpServers.add(value);
        index += 1;
        break;
      }
      case "--reset":
        reset = true;
        break;
      default:
        throw new Error(`Unknown option: ${option}`);
    }
  }

  if (!mode) {
    throw new Error("Missing required --mode");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) {
    throw new Error("Concurrency must be an integer from 1 to 4");
  }
  if (suite === "v0.1-regression" && mode !== "explicit") {
    throw new Error("v0.1-regression supports explicit mode only");
  }
  if (mode === "explicit" && pluginVersion === null) {
    throw new Error("Explicit mode requires --plugin-version");
  }
  if (mode === "baseline" && pluginVersion !== null) {
    throw new Error("Baseline mode forbids --plugin-version");
  }

  const root = resolve(currentDirectory);
  const isV02 = suite === "v0.2";
  return {
    suite,
    mode,
    model,
    reasoningEffort,
    pluginVersion,
    manifestPath: resolve(
      root,
      manifestPath ?? join("evals", "cases", isV02 ? "v0.2/manifest.json" : ""),
    ),
    fixtureDirectory: resolve(
      root,
      fixtureDirectory ??
        join(
          "evals",
          "fixtures",
          isV02 ? "v0.2/anonymized-workspace" : "workspace",
        ),
    ),
    outputPath: resolve(
      root,
      outputPath ??
        join(
          "evals",
          "results",
          "v0.2",
          isV02 ? mode : "v0.1-regression",
          "runs.jsonl",
        ),
    ),
    concurrency,
    disabledMcpServers: [...disabledMcpServers].sort(),
    reset,
  };
}

const manifestIdentityKeys = [
  "suite",
  "mode",
  "codexVersion",
  "model",
  "reasoningEffort",
  "pluginVersion",
  "fixtureHash",
  "memoryIsolation",
  "disabledMcpServers",
] as const satisfies readonly (keyof V02RunManifest)[];

export function assertRunManifestCompatibility(
  existing: V02RunManifest,
  requested: V02RunManifest,
): void {
  for (const key of manifestIdentityKeys) {
    const left = existing[key];
    const right = requested[key];
    const matches =
      Array.isArray(left) && Array.isArray(right)
        ? JSON.stringify(left) === JSON.stringify(right)
        : left === right;
    if (!matches) {
      throw new Error(`Run manifest mismatch: ${key}`);
    }
  }
}

const exists = async (path: string) => {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const backupTimestamp = (date: Date) =>
  date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(".", "");

export async function backupRunArtifacts(
  paths: string[],
  date = new Date(),
): Promise<string[]> {
  const suffix = `.bak-${backupTimestamp(date)}`;
  const backups: string[] = [];
  for (const path of paths) {
    if (!(await exists(path))) {
      continue;
    }
    const backupPath = `${path}${suffix}`;
    if (await exists(backupPath)) {
      throw new Error(`Backup already exists: ${backupPath}`);
    }
    await rename(path, backupPath);
    backups.push(backupPath);
  }
  return backups;
}

export function selectPendingAttempts<T extends PlannedRunIdentity>(
  attempts: T[],
  successfulKeys: Set<string>,
): T[] {
  return attempts.filter((attempt) => !successfulKeys.has(v02RunKey(attempt)));
}
const listFixtureFiles = async (
  root: string,
  directory: string,
): Promise<string[]> => {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Fixture contains symbolic link: ${relative(root, path)}`,
      );
    }
    if (entry.isDirectory()) {
      files.push(...(await listFixtureFiles(root, path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
};

export async function hashFixtureTree(directory: string): Promise<string> {
  const root = resolve(directory);
  const files = (await listFixtureFiles(root, root)).sort((left, right) =>
    relative(root, left).localeCompare(relative(root, right), "en"),
  );
  const hash = createHash("sha256");
  for (const file of files) {
    const path = relative(root, file).split(sep).join("/");
    const contents = await readFile(file);
    hash.update(
      `${Buffer.byteLength(path, "utf8")}:${path}:${contents.length}:`,
    );
    hash.update(contents);
  }
  return hash.digest("hex");
}
export type RunV02Summary = {
  planned: number;
  executed: number;
  skipped: number;
  failed: number;
};

export type RunV02Dependencies = {
  getCodexVersion: () => Promise<string>;
  loadV02: typeof loadV02Suite;
  loadLegacy: typeof loadEvalCases;
  runV02: (
    attempt: PlannedV02Attempt,
    context: V02RunExecutionContext,
  ) => Promise<V02EvalRun>;
  runLegacy: (
    attempt: PlannedLegacyAttempt,
    context: V02RunExecutionContext,
  ) => Promise<V02EvalRun>;
};

const defaultDependencies: RunV02Dependencies = {
  getCodexVersion: async () => {
    const result = await execa("codex", ["--version"], { shell: false });
    return result.stdout.trim();
  },
  loadV02: loadV02Suite,
  loadLegacy: loadEvalCases,
  runV02: runCodexV02Attempt,
  runLegacy: runCodexLegacyAttempt,
};

type PlannedExecution = {
  identity: PlannedRunIdentity;
  run: (context: V02RunExecutionContext) => Promise<V02EvalRun>;
};

const runManifestPathFor = (outputPath: string) =>
  join(dirname(outputPath), "run-manifest.json");

const readRunManifest = async (path: string) =>
  V02RunManifestSchema.parse(
    JSON.parse(await readFile(path, "utf8")) as unknown,
  );

const planExecutions = async (
  options: RunV02Options,
  dependencies: RunV02Dependencies,
): Promise<PlannedExecution[]> => {
  if (options.suite === "v0.2") {
    const { cases } = await dependencies.loadV02(options.manifestPath);
    return cases.flatMap((evalCase) =>
      planV02Attempts(evalCase, options.mode).map((attempt) => ({
        identity: {
          suite: "v0.2",
          caseId: evalCase.id,
          mode: options.mode,
          attempt: attempt.attempt,
        },
        run: (context: V02RunExecutionContext) =>
          dependencies.runV02(attempt, context),
      })),
    );
  }

  const cases = await dependencies.loadLegacy(options.manifestPath);
  return planLegacyAttempts(cases).map((attempt) => ({
    identity: {
      suite: "v0.1-regression",
      caseId: attempt.evalCase.id,
      mode: "explicit",
      attempt: 1,
    },
    run: (context: V02RunExecutionContext) =>
      dependencies.runLegacy(attempt, context),
  }));
};

export async function runV02Evaluation(
  options: RunV02Options,
  overrides: Partial<RunV02Dependencies> = {},
): Promise<RunV02Summary> {
  const dependencies = { ...defaultDependencies, ...overrides };
  const runManifestPath = runManifestPathFor(options.outputPath);
  if (options.reset) {
    await backupRunArtifacts([options.outputPath, runManifestPath]);
  }

  const [fixtureHash, codexVersion] = await Promise.all([
    hashFixtureTree(options.fixtureDirectory),
    dependencies.getCodexVersion(),
  ]);
  const requestedManifest: V02RunManifest = {
    suite: options.suite,
    mode: options.mode,
    codexVersion,
    model: options.model,
    reasoningEffort: options.reasoningEffort,
    pluginVersion: options.pluginVersion,
    fixtureHash,
    memoryIsolation: "disabled",
    disabledMcpServers: options.disabledMcpServers,
    createdAt: new Date().toISOString(),
  };

  const hasOutput = await exists(options.outputPath);
  const hasManifest = await exists(runManifestPath);
  if (hasOutput && !hasManifest) {
    throw new Error(`Run output has no manifest: ${options.outputPath}`);
  }
  if (hasManifest) {
    assertRunManifestCompatibility(
      await readRunManifest(runManifestPath),
      requestedManifest,
    );
  } else {
    await mkdir(dirname(runManifestPath), { recursive: true });
    await writeFile(
      runManifestPath,
      `${JSON.stringify(requestedManifest, null, 2)}\n`,
      "utf8",
    );
  }

  const executions = await planExecutions(options, dependencies);
  const successfulKeys = successfulV02RunKeys(
    await loadV02Runs(options.outputPath),
  );
  const pendingIdentities = selectPendingAttempts(
    executions.map((execution) => ({ ...execution.identity, execution })),
    successfulKeys,
  );
  const pending = pendingIdentities.map((item) => item.execution);
  const context: V02RunExecutionContext = {
    metadata: requestedManifest,
    fixtureDirectory: options.fixtureDirectory,
  };
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < pending.length) {
      const execution = pending[nextIndex];
      nextIndex += 1;
      if (!execution) {
        return;
      }
      const result = await execution.run(context);
      await appendV02Run(options.outputPath, result);
    }
  };
  await Promise.all(
    Array.from({ length: options.concurrency }, async () => worker()),
  );

  const plannedKeys = new Set(
    executions.map((execution) => v02RunKey(execution.identity)),
  );
  const effective = effectiveV02Runs(await loadV02Runs(options.outputPath));
  const failed = effective.filter(
    (item) =>
      plannedKeys.has(v02RunKey(item)) &&
      !(
        item.status === "completed" &&
        item.exitCode === 0 &&
        item.output.trim() !== ""
      ),
  ).length;

  return {
    planned: executions.length,
    executed: pending.length,
    skipped: executions.length - pending.length,
    failed,
  };
}
