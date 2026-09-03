import { execa } from "execa";

import type { EvalCase } from "./schema.js";
import type { EvalMode, EvalRun } from "./result-schema.js";

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type CommandOptions = {
  input: string;
  shell: false;
  timeout: number;
};

export type CommandExecutor = (
  file: string,
  args: string[],
  options: CommandOptions,
) => Promise<CommandResult>;

export type RunSummary = {
  total: number;
  succeeded: number;
  failed: number;
  model: string | null;
  codexVersion: string | null;
  completedAt: string;
};

const executeCommand: CommandExecutor = async (file, args, options) => {
  const result = await execa(file, args, {
    input: options.input,
    reject: false,
    shell: options.shell,
    timeout: options.timeout,
  });
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
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

const parseJsonLines = (contents: string): Record<string, unknown>[] =>
  contents
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });

const readAgentOutput = (events: Record<string, unknown>[]): string => {
  const messages = events.flatMap((event) => {
    if (event.type !== "item.completed" || typeof event.item !== "object") {
      return [];
    }
    const item = event.item as Record<string, unknown>;
    return item.type === "agent_message" && typeof item.text === "string"
      ? [item.text]
      : [];
  });
  return messages.at(-1) ?? "";
};

export async function runCodexCase(
  evalCase: Pick<EvalCase, "id" | "kind" | "input">,
  mode: EvalMode,
  codexVersion: string,
  model: string,
  execute: CommandExecutor = executeCommand,
): Promise<EvalRun> {
  const startedAt = new Date().toISOString();
  const result = await execute(
    "codex",
    [
      "exec",
      "--ephemeral",
      "--json",
      "--model",
      model,
      "--sandbox",
      "read-only",
      "--cd",
      "evals/fixtures/workspace",
      "-",
    ],
    {
      input: buildPrompt(evalCase.input, mode),
      shell: false,
      timeout: 180_000,
    },
  );
  const events = parseJsonLines(result.stdout);

  return {
    caseId: evalCase.id,
    kind: evalCase.kind,
    mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    codexVersion,
    model,
    exitCode: result.exitCode,
    output: readAgentOutput(events),
    stderr: result.stderr,
  };
}
