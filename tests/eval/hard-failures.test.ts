import { describe, expect, it } from "vitest";

import {
  evaluateAutomaticChecks,
  validateAutomaticCheckDefinitions,
} from "../../src/eval/hard-failures.js";
import type { V02EvalCase } from "../../src/eval/v02-schema.js";
import type {
  V02EvalRun,
  V02RunStatus,
} from "../../src/eval/v02-result-schema.js";

const hash = "a".repeat(64);

const baseCase: V02EvalCase = {
  schemaVersion: "0.2",
  id: "v02-format-001",
  kind: "generation",
  scenarioType: "format",
  surface: "docs",
  domain: "software",
  input: "입력",
  expectedBehavior: ["요청한 형식을 지킨다"],
  forbiddenBehavior: [],
  protectedTokens: [],
  protectedFacts: ["기술적 의미를 보존한다"],
  expectedRegister: "한다체",
  projectVocabulary: { preferred: [], accepted: [], forbidden: [] },
  requiredFormat: [],
  automaticChecks: {
    requiredSubstrings: [],
    forbiddenSubstrings: [],
    requiredPatterns: [],
    forbiddenPatterns: [],
  },
  provenance: "synthetic",
  sourceIds: ["engineering-line-writing-001"],
  repeatCount: 1,
  privacyReviewed: true,
};

const caseWith = (overrides: Partial<V02EvalCase> = {}): V02EvalCase => ({
  ...baseCase,
  ...overrides,
});

const completedRunWith = (
  output: string,
  overrides: Partial<V02EvalRun> = {},
): V02EvalRun => ({
  suite: "v0.2",
  caseId: baseCase.id,
  mode: "explicit",
  attempt: 1,
  status: "completed",
  startedAt: "2026-09-04T00:00:00.000Z",
  finishedAt: "2026-09-04T00:00:01.000Z",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: "0.2.0-rc.1",
  fixtureHash: hash,
  memoryIsolation: "disabled",
  disabledMcpServers: [],
  promptHash: hash,
  exitCode: 0,
  output,
  stderr: "",
  ...overrides,
});

const rulesFor = (evalCase: V02EvalCase, output: string) =>
  evaluateAutomaticChecks(evalCase, completedRunWith(output)).violations.map(
    (item) => item.rule,
  );

describe("v0.2 deterministic hard failures", () => {
  it("reports every independent content violation in deterministic order", () => {
    const result = evaluateAutomaticChecks(
      caseWith({
        protectedTokens: ["AbortController"],
        projectVocabulary: {
          preferred: ["서랍"],
          accepted: [],
          forbidden: ["드로어"],
        },
        automaticChecks: {
          requiredSubstrings: ["취소"],
          forbiddenSubstrings: ["다시 시도해 주세요"],
          requiredPatterns: [],
          forbiddenPatterns: [],
        },
      }),
      completedRunWith("드로어를 표시합니다. 다시 시도해 주세요."),
    );

    expect(result.violations.map((item) => item.rule)).toEqual([
      "protected-token",
      "required-substring",
      "forbidden-substring",
      "project-vocabulary",
    ]);
    expect(result.passed).toBe(false);
  });

  it.each(["failed", "timeout", "interrupted"] satisfies V02RunStatus[])(
    "reports %s execution as a run-status violation",
    (status) => {
      const result = evaluateAutomaticChecks(
        baseCase,
        completedRunWith("결과", { status, exitCode: 1 }),
      );

      expect(result.violations.map((item) => item.rule)).toEqual([
        "run-status",
      ]);
    },
  );

  it("reports completed output containing only whitespace as empty", () => {
    expect(rulesFor(baseCase, " \n\t")).toEqual(["empty-output"]);
  });

  it("does not treat an empty result as valid single-line output", () => {
    expect(
      rulesFor(caseWith({ requiredFormat: ["single-line"] }), "   "),
    ).toEqual(["empty-output", "required-format"]);
  });
  it.each([
    ["서랍을 표시한다", []],
    ["패널을 표시한다", ["required-pattern"]],
    ["서랍 드로어", ["forbidden-pattern"]],
  ] as const)("applies declared regular expressions to %s", (output, rules) => {
    expect(
      rulesFor(
        caseWith({
          automaticChecks: {
            requiredSubstrings: [],
            forbiddenSubstrings: [],
            requiredPatterns: ["^서랍"],
            forbiddenPatterns: ["드로어$"],
          },
        }),
        output,
      ),
    ).toEqual(rules);
  });

  it("rejects an invalid declared regular expression with case context", () => {
    expect(() =>
      validateAutomaticCheckDefinitions(
        caseWith({
          automaticChecks: {
            requiredSubstrings: [],
            forbiddenSubstrings: [],
            requiredPatterns: ["("],
            forbiddenPatterns: [],
          },
        }),
      ),
    ).toThrow("Invalid required pattern in v02-format-001: (");
  });

  it("requires one declared expected string for exact-output", () => {
    expect(() =>
      validateAutomaticCheckDefinitions(
        caseWith({ requiredFormat: ["exact-output"] }),
      ),
    ).toThrow(
      "exact-output requires exactly one required substring in v02-format-001",
    );
  });
  it("reports every forbidden project term found in the output", () => {
    const result = evaluateAutomaticChecks(
      caseWith({
        projectVocabulary: {
          preferred: ["서랍"],
          accepted: ["패널"],
          forbidden: ["드로어", "drawer"],
        },
      }),
      completedRunWith("드로어 drawer"),
    );

    expect(result.violations).toEqual([
      { rule: "project-vocabulary", detail: "Forbidden project term: 드로어" },
      { rule: "project-vocabulary", detail: "Forbidden project term: drawer" },
    ]);
  });

  it.each([
    ["single-line", "저장", "저장\n완료", []],
    ["bullet-list", "- 하나\n* 둘", "- 하나\n둘", []],
    [
      "markdown-table",
      "| 이름 | 값 |\n| --- | --- |\n| A | 1 |",
      "| 이름 | 값 |\n| A | 1 |",
      [],
    ],
    [
      "commit-subject",
      "캐시 키 생성 로직 단순화",
      "- 캐시 키 생성 로직 단순화",
      [],
    ],
    ["exact-output", "변경 없음", "변경 없음\n설명", ["변경 없음"]],
  ] as const)(
    "accepts valid %s output and rejects its malformed counterpart",
    (format, valid, invalid, requiredSubstrings) => {
      const evalCase = caseWith({
        requiredFormat: [format],
        automaticChecks: {
          requiredSubstrings: [...requiredSubstrings],
          forbiddenSubstrings: [],
          requiredPatterns: [],
          forbiddenPatterns: [],
        },
      });

      expect(rulesFor(evalCase, valid)).toEqual([]);
      expect(rulesFor(evalCase, invalid)).toEqual(["required-format"]);
    },
  );

  it("returns the run identity when all automatic checks pass", () => {
    expect(evaluateAutomaticChecks(baseCase, completedRunWith("결과"))).toEqual(
      {
        caseId: baseCase.id,
        mode: "explicit",
        attempt: 1,
        passed: true,
        violations: [],
      },
    );
  });
});
