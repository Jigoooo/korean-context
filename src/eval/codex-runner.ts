import { executeCodexPrompt, type CommandExecutor } from "./codex-process.js";
import type { EvalCase } from "./schema.js";
import type { EvalMode, EvalRun } from "./result-schema.js";

export type {
  CommandExecutor,
  CommandOptions,
  CommandResult,
} from "./codex-process.js";

export type RunSummary = {
  total: number;
  succeeded: number;
  failed: number;
  model: string | null;
  codexVersion: string | null;
  completedAt: string;
};

export function buildPrompt(input: string, mode: EvalMode): string {
  if (mode !== "explicit") {
    return input;
  }
  return `Use $korean-context for the Korean artifact in this request.\n\n${input}`;
}

export const isSuccessfulRun = (
  run: Pick<EvalRun, "exitCode" | "output">,
): boolean => run.exitCode === 0 && run.output.trim() !== "";

export function latestRuns(runs: EvalRun[]): EvalRun[] {
  const latestByCase = new Map<string, EvalRun>();
  for (const run of runs) {
    latestByCase.set(run.caseId, run);
  }
  return [...latestByCase.values()];
}

export function summarizeRuns(runs: EvalRun[]): RunSummary {
  const latest = latestRuns(runs);
  const succeeded = latest.filter(isSuccessfulRun).length;
  const lastRun = latest.at(-1);

  return {
    total: latest.length,
    succeeded,
    failed: latest.length - succeeded,
    model: lastRun?.model ?? null,
    codexVersion: lastRun?.codexVersion ?? null,
    completedAt: new Date().toISOString(),
  };
}

export async function runCodexCase(
  evalCase: Pick<EvalCase, "id" | "kind" | "input">,
  mode: EvalMode,
  codexVersion: string,
  model: string,
  execute?: CommandExecutor,
): Promise<EvalRun> {
  const startedAt = new Date().toISOString();
  const result = await executeCodexPrompt(
    {
      prompt: buildPrompt(evalCase.input, mode),
      model,
      fixtureDirectory: "evals/fixtures/workspace",
      timeoutMs: 180_000,
    },
    execute,
  );

  return {
    caseId: evalCase.id,
    kind: evalCase.kind,
    mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    codexVersion,
    model,
    exitCode: result.exitCode,
    output: result.output,
    stderr: result.stderr,
  };
}
