import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { execa } from "execa";
import { z } from "zod";

import {
  isSuccessfulRun,
  latestRuns,
  runCodexCase,
  summarizeRuns,
} from "./codex-runner.js";
import { loadEvalCases } from "./load-cases.js";
import { evalModes, EvalRunSchema, type EvalMode } from "./result-schema.js";

const CliOptionsSchema = z.object({
  mode: z.enum(evalModes),
  liveOnly: z.boolean(),
  concurrency: z.number().int().min(1).max(4),
  model: z.string().min(1),
  output: z.string().min(1),
});

const readArgument = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const mode = readArgument("--mode") as EvalMode | undefined;
const options = CliOptionsSchema.parse({
  mode,
  liveOnly: process.argv.includes("--live-only"),
  concurrency: Number(readArgument("--concurrency") ?? 2),
  model: readArgument("--model") ?? "gpt-5.6-sol",
  output:
    readArgument("--output") ??
    `evals/results/v0.1/${mode ?? "unknown"}/runs.jsonl`,
});

const existingIds = new Set<string>();
try {
  const contents = await readFile(options.output, "utf8");
  for (const line of contents.split(/\r?\n/u).filter(Boolean)) {
    const run = EvalRunSchema.parse(JSON.parse(line));
    if (isSuccessfulRun(run)) {
      existingIds.add(run.caseId);
    }
  }
} catch (error) {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
}

const cases = (await loadEvalCases("evals/cases"))
  .filter((item) => !options.liveOnly || item.live)
  .filter((item) => !existingIds.has(item.id));
const versionResult = await execa("codex", ["--version"]);
const codexVersion = versionResult.stdout.trim();

await mkdir(dirname(options.output), { recursive: true });
let nextIndex = 0;
let writeQueue = Promise.resolve();

const worker = async () => {
  while (nextIndex < cases.length) {
    const evalCase = cases[nextIndex];
    nextIndex += 1;
    if (!evalCase) {
      return;
    }
    const run = await runCodexCase(
      evalCase,
      options.mode,
      codexVersion,
      options.model,
    );
    writeQueue = writeQueue.then(() =>
      appendFile(options.output, `${JSON.stringify(run)}\n`, "utf8"),
    );
    await writeQueue;
    console.log(`${run.caseId} ${isSuccessfulRun(run) ? "PASS" : "FAIL"}`);
  }
};

await Promise.all(
  Array.from({ length: options.concurrency }, async () => worker()),
);
await writeQueue;

const allRuns = (await readFile(options.output, "utf8"))
  .split(/\r?\n/u)
  .filter(Boolean)
  .map((line) => EvalRunSchema.parse(JSON.parse(line)));
const summary = summarizeRuns(allRuns);
const compactedRuns = latestRuns(allRuns);
await writeFile(
  options.output,
  `${compactedRuns.map((run) => JSON.stringify(run)).join("\n")}\n`,
  "utf8",
);
await writeFile(
  join(dirname(options.output), "summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
  "utf8",
);

console.log(
  `Completed ${cases.length} ${options.mode} runs; skipped ${existingIds.size}`,
);
if (summary.failed > 0) {
  process.exitCode = 1;
}
