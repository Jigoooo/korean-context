import { describe, expect, it } from "vitest";

import {
  buildPrompt,
  isSuccessfulRun,
  latestRuns,
  runCodexCase,
  summarizeRuns,
  type CommandExecutor,
} from "../../src/eval/codex-runner.js";
import type { EvalRun } from "../../src/eval/result-schema.js";

const runFixture = (
  caseId: string,
  exitCode: number,
  output: string,
): EvalRun => ({
  caseId,
  kind: "boundary",
  mode: "baseline",
  startedAt: "2026-09-03T00:00:00.000Z",
  finishedAt: "2026-09-03T00:00:01.000Z",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  exitCode,
  output,
  stderr: "",
});

describe("Codex evaluation runner", () => {
  it("adds explicit invocation only in explicit mode", () => {
    expect(buildPrompt("문구를 고쳐줘", "explicit")).toContain(
      "$korean-context",
    );
    expect(buildPrompt("문구를 고쳐줘", "implicit")).toBe("문구를 고쳐줘");
    expect(buildPrompt("문구를 고쳐줘", "baseline")).toBe("문구를 고쳐줘");
  });

  it("passes prompts over stdin without a shell", async () => {
    const calls: Parameters<CommandExecutor>[] = [];
    const execute: CommandExecutor = (...parameters) => {
      calls.push(parameters);
      return Promise.resolve({
        exitCode: 0,
        stdout: [
          '{"type":"item.completed","item":{"type":"agent_message","text":"초안"}}',
          '{"type":"item.completed","item":{"type":"agent_message","text":"결과"}}',
          '{"type":"turn.completed"}',
        ].join("\n"),
        stderr: "",
      });
    };

    const result = await runCodexCase(
      { id: "repair-001", kind: "repair", input: "문구를 고쳐줘" },
      "baseline",
      "codex-cli 0.147.0",
      "gpt-5.6-sol",
      execute,
    );

    expect(calls[0]?.[0]).toBe("codex");
    expect(calls[0]?.[1]).toContain("--ephemeral");
    expect(calls[0]?.[1]).toContain("gpt-5.6-sol");
    expect(calls[0]?.[1]).not.toContain("model_reasoning_effort=xhigh");
    expect(calls[0]?.[2]).toMatchObject({
      input: "문구를 고쳐줘",
      shell: false,
    });
    expect(result.output).toBe("결과");
    expect(result.model).toBe("gpt-5.6-sol");
    expect(result.exitCode).toBe(0);
  });

  it("treats non-zero and empty results as failures", () => {
    expect(isSuccessfulRun(runFixture("boundary-001", 1, "답변"))).toBe(false);
    expect(isSuccessfulRun(runFixture("boundary-001", 0, ""))).toBe(false);
    expect(isSuccessfulRun(runFixture("boundary-001", 0, "답변"))).toBe(true);
  });

  it("summarizes the latest attempt for each case", () => {
    const attempts = [
      runFixture("boundary-001", 1, "첫 시도"),
      runFixture("boundary-002", 0, "정상"),
      runFixture("boundary-001", 0, "재시도"),
    ];
    const summary = summarizeRuns(attempts);

    expect(summary).toMatchObject({
      total: 2,
      succeeded: 2,
      failed: 0,
      model: "gpt-5.6-sol",
      codexVersion: "codex-cli 0.147.0",
    });
    expect(latestRuns(attempts)).toEqual([
      runFixture("boundary-001", 0, "재시도"),
      runFixture("boundary-002", 0, "정상"),
    ]);
  });
});
