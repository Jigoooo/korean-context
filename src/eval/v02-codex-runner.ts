import { createHash } from "node:crypto";

import { executeCodexPrompt, type CommandExecutor } from "./codex-process.js";
import { redactPrivateText } from "./privacy.js";
import type { EvalCase } from "./schema.js";
import type { V02EvalCase } from "./v02-schema.js";
import type {
  V02EvalRun,
  V02Mode,
  V02RunManifest,
} from "./v02-result-schema.js";

export type PlannedV02Attempt = {
  evalCase: V02EvalCase;
  mode: V02Mode;
  attempt: 1 | 2 | 3;
};
export type PlannedLegacyAttempt = {
  evalCase: EvalCase;
  mode: "explicit";
  attempt: 1;
};

export type V02RunExecutionContext = {
  metadata: V02RunManifest;
  fixtureDirectory: string;
  timeoutMs?: number;
};

export function planV02Attempts(
  evalCase: V02EvalCase,
  mode: V02Mode,
): PlannedV02Attempt[] {
  if (evalCase.repeatCount === 1) {
    return [{ evalCase, mode, attempt: 1 }];
  }
  return [1, 2, 3].map((attempt) => ({
    evalCase,
    mode,
    attempt: attempt as 1 | 2 | 3,
  }));
}

export function planLegacyAttempts(cases: EvalCase[]): PlannedLegacyAttempt[] {
  return cases.map((evalCase) => ({ evalCase, mode: "explicit", attempt: 1 }));
}
export function buildV02Prompt(
  evalCase: Pick<V02EvalCase, "input">,
  mode: V02Mode,
): string {
  if (mode === "baseline") {
    return evalCase.input;
  }
  return `Use $korean-context for this request. Follow its artifact boundary and do not assume the request asks for an artifact.\n\n${evalCase.input}`;
}

const sha256 = (input: string) =>
  createHash("sha256").update(input).digest("hex");

export async function runCodexV02Attempt(
  attempt: PlannedV02Attempt,
  context: V02RunExecutionContext,
  execute?: CommandExecutor,
): Promise<V02EvalRun> {
  if (context.metadata.suite !== "v0.2") {
    throw new Error("V02 case runner requires the v0.2 suite");
  }
  if (context.metadata.mode !== attempt.mode) {
    throw new Error("Attempt mode does not match run manifest mode");
  }
  if (
    (attempt.mode === "baseline" && context.metadata.pluginVersion !== null) ||
    (attempt.mode === "explicit" && context.metadata.pluginVersion === null)
  ) {
    throw new Error("Plugin version does not match evaluation mode");
  }

  const prompt = buildV02Prompt(attempt.evalCase, attempt.mode);
  const startedAt = new Date().toISOString();
  const result = await executeCodexPrompt(
    {
      prompt,
      model: context.metadata.model,
      reasoningEffort: context.metadata.reasoningEffort,
      memoryIsolation: context.metadata.memoryIsolation,
      disabledMcpServers: context.metadata.disabledMcpServers,
      fixtureDirectory: context.fixtureDirectory,
      timeoutMs: context.timeoutMs ?? 180_000,
    },
    execute,
  );

  return {
    suite: context.metadata.suite,
    caseId: attempt.evalCase.id,
    mode: attempt.mode,
    attempt: attempt.attempt,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    codexVersion: context.metadata.codexVersion,
    model: context.metadata.model,
    reasoningEffort: context.metadata.reasoningEffort,
    pluginVersion: context.metadata.pluginVersion,
    fixtureHash: context.metadata.fixtureHash,
    memoryIsolation: context.metadata.memoryIsolation,
    disabledMcpServers: context.metadata.disabledMcpServers,
    promptHash: sha256(prompt),
    exitCode: result.exitCode,
    output: result.output,
    stderr: redactPrivateText(result.stderr),
  };
}
export async function runCodexLegacyAttempt(
  attempt: PlannedLegacyAttempt,
  context: V02RunExecutionContext,
  execute?: CommandExecutor,
): Promise<V02EvalRun> {
  if (context.metadata.suite !== "v0.1-regression") {
    throw new Error("Legacy case runner requires the v0.1-regression suite");
  }
  if (
    context.metadata.mode !== "explicit" ||
    context.metadata.pluginVersion === null
  ) {
    throw new Error("v0.1-regression requires explicit plugin execution");
  }

  const prompt = buildV02Prompt(attempt.evalCase, "explicit");
  const startedAt = new Date().toISOString();
  const result = await executeCodexPrompt(
    {
      prompt,
      model: context.metadata.model,
      reasoningEffort: context.metadata.reasoningEffort,
      memoryIsolation: context.metadata.memoryIsolation,
      disabledMcpServers: context.metadata.disabledMcpServers,
      fixtureDirectory: context.fixtureDirectory,
      timeoutMs: context.timeoutMs ?? 180_000,
    },
    execute,
  );

  return {
    suite: "v0.1-regression",
    caseId: attempt.evalCase.id,
    mode: "explicit",
    attempt: 1,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    codexVersion: context.metadata.codexVersion,
    model: context.metadata.model,
    reasoningEffort: context.metadata.reasoningEffort,
    pluginVersion: context.metadata.pluginVersion,
    fixtureHash: context.metadata.fixtureHash,
    memoryIsolation: context.metadata.memoryIsolation,
    disabledMcpServers: context.metadata.disabledMcpServers,
    promptHash: sha256(prompt),
    exitCode: result.exitCode,
    output: result.output,
    stderr: redactPrivateText(result.stderr),
  };
}
