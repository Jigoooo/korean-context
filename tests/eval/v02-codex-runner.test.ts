import { describe, expect, it } from "vitest";

import {
  executeCodexPrompt,
  type CommandExecutor,
} from "../../src/eval/codex-process.js";
import {
  buildV02Prompt,
  planLegacyAttempts,
  planV02Attempts,
  runCodexLegacyAttempt,
  runCodexV02Attempt,
} from "../../src/eval/v02-codex-runner.js";
import type { EvalCase } from "../../src/eval/schema.js";
import type { V02EvalCase } from "../../src/eval/v02-schema.js";
import type { V02RunManifest } from "../../src/eval/v02-result-schema.js";

const hash = "a".repeat(64);

const testCase: V02EvalCase = {
  schemaVersion: "0.2",
  id: "v02-real-world-repair-001",
  kind: "repair",
  scenarioType: "real-world-repair",
  surface: "ui",
  domain: "frontend",
  input: "입력",
  expectedBehavior: ["자연스럽게 고친다"],
  forbiddenBehavior: [],
  protectedTokens: [],
  protectedFacts: ["의미를 보존한다"],
  expectedRegister: "합니다체",
  projectVocabulary: { preferred: [], accepted: [], forbidden: [] },
  requiredFormat: ["exact-output"],
  automaticChecks: {
    requiredSubstrings: [],
    forbiddenSubstrings: [],
    requiredPatterns: [],
    forbiddenPatterns: [],
  },
  provenance: "synthetic",
  sourceIds: ["engineering-line-writing-001"],
  repeatCount: 3,
  privacyReviewed: true,
};

const metadata: V02RunManifest = {
  suite: "v0.2",
  mode: "explicit",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: "0.2.0-rc.1",
  fixtureHash: hash,
  createdAt: "2026-09-04T00:00:00.000Z",
};
const legacyCase: EvalCase = {
  id: "repair-001",
  kind: "repair",
  surface: "ui",
  domain: "frontend",
  input: "입력",
  expectedBehavior: ["자연스럽게 고친다"],
  forbiddenBehavior: [],
  protectedTokens: [],
  expectedRegister: "합니다체",
  sourceIds: ["engineering-line-writing-001"],
  live: false,
};

describe("v0.2 Codex runner", () => {
  it("plans one or three attempts from case metadata", () => {
    expect(
      planV02Attempts({ ...testCase, repeatCount: 1 }, "baseline"),
    ).toEqual([
      {
        evalCase: { ...testCase, repeatCount: 1 },
        mode: "baseline",
        attempt: 1,
      },
    ]);
    expect(
      planV02Attempts(testCase, "explicit").map((item) => item.attempt),
    ).toEqual([1, 2, 3]);
  });

  it("adds the skill invocation only in explicit mode", () => {
    expect(buildV02Prompt(testCase, "explicit")).toBe(
      "Use $korean-context for the Korean artifact in this request.\n\n입력",
    );
    expect(buildV02Prompt(testCase, "baseline")).toBe("입력");
  });

  it("passes controlled Codex arguments and records the last agent message", async () => {
    const calls: Parameters<CommandExecutor>[] = [];
    const execute: CommandExecutor = (...parameters) => {
      calls.push(parameters);
      return Promise.resolve({
        exitCode: 0,
        stdout: [
          '{"type":"item.completed","item":{"type":"agent_message","text":"초안"}}',
          '{"type":"item.completed","item":{"type":"agent_message","text":"최종"}}',
          '{"type":"turn.completed"}',
        ].join("\n"),
        stderr: "",
      });
    };

    const [attempt] = planV02Attempts(testCase, "explicit");
    if (!attempt) {
      throw new Error("Expected an attempt");
    }
    const result = await runCodexV02Attempt(
      attempt,
      {
        metadata,
        fixtureDirectory: "evals/fixtures/v0.2/anonymized-workspace",
      },
      execute,
    );

    expect(calls).toEqual([
      [
        "codex",
        [
          "exec",
          "--ephemeral",
          "--json",
          "--model",
          "gpt-5.6-sol",
          "--sandbox",
          "read-only",
          "--cd",
          "evals/fixtures/v0.2/anonymized-workspace",
          "-c",
          "model_reasoning_effort=xhigh",
          "-",
        ],
        {
          input:
            "Use $korean-context for the Korean artifact in this request.\n\n입력",
          shell: false,
          timeout: 180_000,
        },
      ],
    ]);
    expect(result).toMatchObject({
      suite: "v0.2",
      caseId: testCase.id,
      mode: "explicit",
      attempt: 1,
      status: "completed",
      output: "최종",
      promptHash:
        "04136058ce82f48dd54f3de907ff82057bf4c326314885912516d21c6cd26742",
    });
  });

  it("records timeout and interruption without dropping stderr", async () => {
    const timedOut: CommandExecutor = () =>
      Promise.reject(
        Object.assign(new Error("deadline exceeded"), {
          timedOut: true,
          stdout: "",
          stderr: "timeout detail",
          exitCode: 1,
        }),
      );
    const interrupted: CommandExecutor = () =>
      Promise.reject(
        Object.assign(new Error("canceled"), {
          isCanceled: true,
          stdout: "",
          stderr: "interrupt detail",
          exitCode: 1,
        }),
      );

    await expect(
      executeCodexPrompt(
        {
          prompt: "입력",
          model: "gpt-5.6-sol",
          reasoningEffort: "xhigh",
          fixtureDirectory: "fixture",
          timeoutMs: 1,
        },
        timedOut,
      ),
    ).resolves.toMatchObject({ status: "timeout", stderr: "timeout detail" });
    await expect(
      executeCodexPrompt(
        {
          prompt: "입력",
          model: "gpt-5.6-sol",
          reasoningEffort: "xhigh",
          fixtureDirectory: "fixture",
          timeoutMs: 1,
        },
        interrupted,
      ),
    ).resolves.toMatchObject({
      status: "interrupted",
      stderr: "interrupt detail",
    });
  });

  it("maps a terminated command result to interrupted", async () => {
    const execute: CommandExecutor = () =>
      Promise.resolve({
        exitCode: 130,
        stdout: "",
        stderr: "terminated detail",
        isTerminated: true,
      });

    await expect(
      executeCodexPrompt(
        {
          prompt: "입력",
          model: "gpt-5.6-sol",
          reasoningEffort: "xhigh",
          fixtureDirectory: "fixture",
          timeoutMs: 100,
        },
        execute,
      ),
    ).resolves.toMatchObject({
      status: "interrupted",
      exitCode: 130,
      stderr: "terminated detail",
    });
  });
  it("maps non-zero command results to failed status", async () => {
    const execute: CommandExecutor = () =>
      Promise.resolve({ exitCode: 7, stdout: "", stderr: "failure" });

    await expect(
      executeCodexPrompt(
        {
          prompt: "입력",
          model: "gpt-5.6-sol",
          reasoningEffort: "xhigh",
          fixtureDirectory: "fixture",
          timeoutMs: 100,
        },
        execute,
      ),
    ).resolves.toMatchObject({
      status: "failed",
      exitCode: 7,
      stderr: "failure",
    });
  });
  it("redacts private paths from public run stderr", async () => {
    const execute: CommandExecutor = () =>
      Promise.resolve({
        exitCode: 0,
        stdout:
          '{"type":"item.completed","item":{"type":"agent_message","text":"결과"}}',
        stderr: String.raw`warning C:\Users\alice\.codex\cache`,
      });
    const attempt = planV02Attempts(testCase, "explicit")[0];
    if (!attempt) {
      throw new Error("Expected an attempt");
    }

    const result = await runCodexV02Attempt(
      attempt,
      { metadata, fixtureDirectory: "fixture" },
      execute,
    );
    expect(result.stderr).toContain("<redacted-user-path>");
    expect(result.stderr).not.toContain("alice");
  });
  it("plans and records one explicit v0.1 regression attempt", async () => {
    expect(planLegacyAttempts([legacyCase])).toEqual([
      { evalCase: legacyCase, mode: "explicit", attempt: 1 },
    ]);
    const execute: CommandExecutor = () =>
      Promise.resolve({
        exitCode: 0,
        stdout:
          '{"type":"item.completed","item":{"type":"agent_message","text":"결과"}}',
        stderr: "",
      });
    const attempt = planLegacyAttempts([legacyCase])[0];
    if (!attempt) {
      throw new Error("Expected a legacy attempt");
    }

    await expect(
      runCodexLegacyAttempt(
        attempt,
        {
          metadata: { ...metadata, suite: "v0.1-regression" },
          fixtureDirectory: "evals/fixtures/workspace",
        },
        execute,
      ),
    ).resolves.toMatchObject({
      suite: "v0.1-regression",
      caseId: "repair-001",
      mode: "explicit",
      attempt: 1,
      status: "completed",
      output: "결과",
    });
  });
});
