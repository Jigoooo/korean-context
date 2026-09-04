import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { AutomaticEvaluation } from "../../src/eval/hard-failures.js";
import {
  evaluateV02ReleaseGate,
  loadV02Scores,
  parseScoreV02Arguments,
  summarizeV02Scores,
  V02EvalScoreSchema,
  type V02EvalScore,
  type V02ReleaseGateInput,
} from "../../src/eval/v02-score.js";
import type { V02EvalCase } from "../../src/eval/v02-schema.js";
import type { V02EvalRun } from "../../src/eval/v02-result-schema.js";

const fixtureHash = "a".repeat(64);
const legacyFixtureHash = "b".repeat(64);
const promptHash = "c".repeat(64);

const cases = Array.from({ length: 60 }, (_, index): V02EvalCase => ({
  schemaVersion: "0.2",
  id: `v02-format-${String(index + 1).padStart(3, "0")}`,
  kind: "generation",
  scenarioType: "format",
  surface: "docs",
  domain: "software",
  input: `입력 ${index + 1}`,
  expectedBehavior: ["기술적 의미를 보존한다"],
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
  repeatCount: index < 20 ? 3 : 1,
  privacyReviewed: true,
}));

const runFor = (
  evalCase: V02EvalCase,
  mode: "baseline" | "explicit",
  attempt: number,
): V02EvalRun => ({
  suite: "v0.2",
  caseId: evalCase.id,
  mode,
  attempt,
  status: "completed",
  startedAt: "2026-09-04T00:00:00.000Z",
  finishedAt: "2026-09-04T00:00:01.000Z",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: mode === "explicit" ? "0.2.0-rc.1" : null,
  fixtureHash,
  memoryIsolation: "disabled",
  promptHash,
  exitCode: 0,
  output: "결과",
  stderr: "",
});

const runsFor = (mode: "baseline" | "explicit") =>
  cases.flatMap((evalCase) =>
    Array.from({ length: evalCase.repeatCount }, (_, index) =>
      runFor(evalCase, mode, index + 1),
    ),
  );

const automaticFor = (run: V02EvalRun): AutomaticEvaluation => ({
  caseId: run.caseId,
  mode: run.mode,
  attempt: run.attempt,
  passed: true,
  violations: [],
});

const scoreFor = (run: V02EvalRun): V02EvalScore => ({
  suite: "v0.2",
  caseId: run.caseId,
  mode: run.mode,
  attempt: run.attempt,
  naturalness: 2,
  terminology: 2,
  meaningPreservation: 2,
  surfaceFit: 2,
  translationese: 2,
  technicalMeaningChange: false,
  inventedFact: false,
  projectVocabularyViolation: false,
  protectedContentViolation: false,
  formatViolation: false,
  boundaryViolation: false,
  unnecessaryRewrite: false,
  improvedOverBaseline: run.mode === "explicit",
  goldIssuesTotal: 1,
  goldIssuesCorrected: 1,
  notes: "검토 완료",
});

const legacyRun = (index: number): V02EvalRun => ({
  suite: "v0.1-regression",
  caseId: `repair-${String(index + 1).padStart(3, "0")}`,
  mode: "explicit",
  attempt: 1,
  status: "completed",
  startedAt: "2026-09-04T00:00:00.000Z",
  finishedAt: "2026-09-04T00:00:01.000Z",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: "0.2.0-rc.1",
  fixtureHash: legacyFixtureHash,
  memoryIsolation: "disabled",
  promptHash,
  exitCode: 0,
  output: "결과",
  stderr: "",
});

const completeGateInput = (): V02ReleaseGateInput => {
  const baselineRuns = runsFor("baseline");
  const explicitRuns = runsFor("explicit");
  const allRuns = [...baselineRuns, ...explicitRuns];
  return {
    cases,
    baselineRuns,
    explicitRuns,
    v01RegressionRuns: Array.from({ length: 100 }, (_, index) =>
      legacyRun(index),
    ),
    automaticEvaluations: allRuns.map(automaticFor),
    scores: allRuns.map(scoreFor),
  };
};

const mutateFirstExplicitScore = (
  input: V02ReleaseGateInput,
  mutation: Partial<V02EvalScore>,
) => {
  const index = input.scores.findIndex((score) => score.mode === "explicit");
  input.scores[index] = {
    ...(input.scores[index] as V02EvalScore),
    ...mutation,
  };
  return input;
};

describe("v0.2 release score and gate", () => {
  it("resolves default and explicit score CLI paths from the current directory", () => {
    const defaults = parseScoreV02Arguments([], "fixture-root");
    expect(defaults.manifestPath).toMatch(
      /fixture-root[\\/]evals[\\/]cases[\\/]v0\.2[\\/]manifest\.json$/u,
    );
    expect(defaults.outputPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]gate\.json$/u,
    );
    expect(defaults.baselineRunsPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]baseline[\\/]runs\.jsonl$/u,
    );
    expect(defaults.explicitRunsPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]explicit[\\/]runs\.jsonl$/u,
    );
    expect(defaults.v01RegressionRunsPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]v0\.1-regression[\\/]runs\.jsonl$/u,
    );

    const explicit = parseScoreV02Arguments(
      ["--scores", "review/scores.jsonl", "--output", "review/gate.json"],
      "fixture-root",
    );
    expect(explicit.scoresPath).toMatch(
      /fixture-root[\\/]review[\\/]scores\.jsonl$/u,
    );
    expect(explicit.outputPath).toMatch(
      /fixture-root[\\/]review[\\/]gate\.json$/u,
    );
  });

  it("rejects missing and unknown score CLI options", () => {
    expect(() => parseScoreV02Arguments(["--scores"], ".")).toThrow(
      "Missing value for --scores",
    );
    expect(() => parseScoreV02Arguments(["--unknown", "value"], ".")).toThrow(
      "Unknown option: --unknown",
    );
  });

  it("loads validated score JSONL and reports the original invalid line", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-score-"));
    try {
      const path = join(directory, "scores.jsonl");
      const score = scoreFor(runFor(cases[0] as V02EvalCase, "explicit", 1));
      await writeFile(
        path,
        `${JSON.stringify(score)}\n\n${JSON.stringify(score)}\n`,
        "utf8",
      );
      await expect(loadV02Scores(path)).resolves.toHaveLength(2);

      await writeFile(path, `${JSON.stringify(score)}\n\n{}\n`, "utf8");
      await expect(loadV02Scores(path)).rejects.toThrow(
        `Invalid score at ${path}:3`,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
  it("passes a complete result set at every approved threshold", () => {
    expect(evaluateV02ReleaseGate(completeGateInput())).toEqual({
      passed: true,
      reasons: [],
      average: 10,
      hardFailures: 0,
      unnecessaryRewriteRate: 0,
      formatAdherenceRate: 1,
      goldCorrectionRate: 1,
      repeatedHardFailureVariance: 0,
    });
  });

  it.each([
    ["technical meaning", { technicalMeaningChange: true }],
    ["invented fact", { inventedFact: true }],
    ["project vocabulary", { projectVocabularyViolation: true }],
    ["protected content", { protectedContentViolation: true }],
    ["boundary", { boundaryViolation: true }],
  ] as const)("blocks release on %s failure", (_name, mutation) => {
    const result = evaluateV02ReleaseGate(
      mutateFirstExplicitScore(completeGateInput(), mutation),
    );

    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("explicit-hard-failure");
    expect(result.hardFailures).toBe(1);
  });

  it("requires all attempts", () => {
    const input = completeGateInput();
    input.explicitRuns.pop();

    expect(evaluateV02ReleaseGate(input).reasons).toContain("missing-attempt");
  });

  it("rejects mixed execution configuration before scoring quality", () => {
    const input = completeGateInput();
    input.explicitRuns = input.explicitRuns.map((run) => ({
      ...run,
      model: "other-model",
    }));

    expect(evaluateV02ReleaseGate(input).reasons).toContain(
      "mixed-configuration",
    );
  });

  it("rejects mixed memory-isolation settings", () => {
    const input = completeGateInput();
    input.explicitRuns[0] = {
      ...(input.explicitRuns[0] as V02EvalRun),
      memoryIsolation: "inherit" as "disabled",
    };

    expect(evaluateV02ReleaseGate(input).reasons).toContain(
      "mixed-configuration",
    );
  });

  it("requires 100 successful v0.1 explicit regression runs", () => {
    const input = completeGateInput();
    input.v01RegressionRuns.pop();

    expect(evaluateV02ReleaseGate(input).reasons).toContain("v0.1-regression");

    const failed = completeGateInput();
    failed.v01RegressionRuns[0] = {
      ...(failed.v01RegressionRuns[0] as V02EvalRun),
      status: "failed",
      exitCode: 1,
    };
    expect(evaluateV02ReleaseGate(failed).reasons).toContain("v0.1-regression");
  });

  it("requires one automatic evaluation and score for every v0.2 attempt", () => {
    const input = completeGateInput();
    input.automaticEvaluations.pop();
    input.scores.pop();
    const result = evaluateV02ReleaseGate(input);

    expect(result.reasons).toContain("missing-automatic-evaluation");
    expect(result.reasons).toContain("missing-score");
  });

  it("returns a failed gate instead of throwing when all explicit scores are missing", () => {
    const input = completeGateInput();
    input.scores = input.scores.filter((score) => score.mode === "baseline");

    const result = evaluateV02ReleaseGate(input);
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("missing-score");
  });
  it("blocks baseline infrastructure failures but ignores baseline language findings", () => {
    const languageOnly = completeGateInput();
    languageOnly.automaticEvaluations[0] = {
      ...(languageOnly.automaticEvaluations[0] as AutomaticEvaluation),
      passed: false,
      violations: [{ rule: "project-vocabulary", detail: "comparison only" }],
    };
    expect(evaluateV02ReleaseGate(languageOnly).passed).toBe(true);

    const infrastructure = completeGateInput();
    infrastructure.baselineRuns[0] = {
      ...(infrastructure.baselineRuns[0] as V02EvalRun),
      status: "timeout",
      exitCode: 1,
      output: "",
    };
    expect(evaluateV02ReleaseGate(infrastructure).reasons).toContain(
      "baseline-infrastructure",
    );
  });

  it("counts explicit automatic content failures", () => {
    const input = completeGateInput();
    const index = input.automaticEvaluations.findIndex(
      (evaluation) => evaluation.mode === "explicit",
    );
    input.automaticEvaluations[index] = {
      ...(input.automaticEvaluations[index] as AutomaticEvaluation),
      passed: false,
      violations: [{ rule: "protected-token", detail: "missing token" }],
    };

    const result = evaluateV02ReleaseGate(input);
    expect(result.reasons).toContain("explicit-hard-failure");
    expect(result.hardFailures).toBe(1);
  });

  it("enforces the five-percent unnecessary rewrite threshold", () => {
    const input = completeGateInput();
    const explicit = input.scores.filter((score) => score.mode === "explicit");
    for (const score of explicit.slice(0, 6)) {
      score.unnecessaryRewrite = true;
    }

    const result = evaluateV02ReleaseGate(input);
    expect(result.unnecessaryRewriteRate).toBe(0.06);
    expect(result.reasons).toContain("unnecessary-rewrite-rate");
  });

  it("enforces the ninety-five-percent format adherence threshold", () => {
    const input = completeGateInput();
    const explicit = input.scores.filter((score) => score.mode === "explicit");
    for (const score of explicit.slice(0, 6)) {
      score.formatViolation = true;
    }

    const result = evaluateV02ReleaseGate(input);
    expect(result.formatAdherenceRate).toBe(0.94);
    expect(result.reasons).toContain("format-adherence-rate");
  });

  it("enforces the ninety-percent gold correction threshold", () => {
    const input = completeGateInput();
    const explicit = input.scores.filter((score) => score.mode === "explicit");
    for (const score of explicit.slice(0, 11)) {
      score.goldIssuesCorrected = 0;
    }

    const result = evaluateV02ReleaseGate(input);
    expect(result.goldCorrectionRate).toBe(0.89);
    expect(result.reasons).toContain("gold-correction-rate");
  });

  it("does not count gold corrections from an explicit hard failure", () => {
    const input = mutateFirstExplicitScore(completeGateInput(), {
      technicalMeaningChange: true,
      goldIssuesCorrected: 1,
    });

    expect(evaluateV02ReleaseGate(input).goldCorrectionRate).toBe(0.99);
  });
  it("passes rates exactly on every approved threshold", () => {
    const input = completeGateInput();
    const explicit = input.scores.filter((score) => score.mode === "explicit");
    for (const score of explicit.slice(0, 5)) {
      score.unnecessaryRewrite = true;
      score.formatViolation = true;
    }
    for (const score of explicit.slice(0, 10)) {
      score.goldIssuesCorrected = 0;
    }

    const result = evaluateV02ReleaseGate(input);
    expect(result.unnecessaryRewriteRate).toBe(0.05);
    expect(result.formatAdherenceRate).toBe(0.95);
    expect(result.goldCorrectionRate).toBe(0.9);
    expect(result.passed).toBe(true);
  });

  it("includes automatic required-format failures in format adherence", () => {
    const input = completeGateInput();
    const indices = input.automaticEvaluations
      .map((evaluation, index) => ({ evaluation, index }))
      .filter(({ evaluation }) => evaluation.mode === "explicit")
      .slice(0, 6)
      .map(({ index }) => index);
    for (const index of indices) {
      input.automaticEvaluations[index] = {
        ...(input.automaticEvaluations[index] as AutomaticEvaluation),
        passed: false,
        violations: [
          { rule: "required-format", detail: "format did not match" },
        ],
      };
    }

    const result = evaluateV02ReleaseGate(input);
    expect(result.hardFailures).toBe(0);
    expect(result.formatAdherenceRate).toBe(0.94);
    expect(result.reasons).toContain("format-adherence-rate");
  });
  it("reports hard-failure variance across repeated explicit attempts", () => {
    const input = completeGateInput();
    const repeatedCaseId = cases[0]?.id;
    const index = input.automaticEvaluations.findIndex(
      (evaluation) =>
        evaluation.mode === "explicit" &&
        evaluation.caseId === repeatedCaseId &&
        evaluation.attempt === 1,
    );
    input.automaticEvaluations[index] = {
      ...(input.automaticEvaluations[index] as AutomaticEvaluation),
      passed: false,
      violations: [{ rule: "project-vocabulary", detail: "forbidden term" }],
    };

    const result = evaluateV02ReleaseGate(input);
    expect(result.repeatedHardFailureVariance).toBe(1);
    expect(result.reasons).toContain("repeated-hard-failure-variance");
  });

  it("validates score points, gold counts, and non-empty notes", () => {
    const score = scoreFor(runFor(cases[0] as V02EvalCase, "explicit", 1));

    expect(
      V02EvalScoreSchema.safeParse({ ...score, naturalness: 3 }).success,
    ).toBe(false);
    expect(
      V02EvalScoreSchema.safeParse({
        ...score,
        goldIssuesTotal: 1,
        goldIssuesCorrected: 2,
      }).success,
    ).toBe(false);
    expect(V02EvalScoreSchema.safeParse({ ...score, notes: "" }).success).toBe(
      false,
    );
    expect(
      V02EvalScoreSchema.safeParse({
        ...score,
        mode: "baseline",
        improvedOverBaseline: true,
      }).success,
    ).toBe(false);
  });

  it("rejects inconsistent gold issue totals for the same case", () => {
    const input = completeGateInput();
    const score = input.scores.find(
      (item) => item.mode === "explicit" && item.caseId === cases[0]?.id,
    );
    if (!score) {
      throw new Error("Expected an explicit score");
    }
    score.goldIssuesTotal = 2;

    const result = evaluateV02ReleaseGate(input);
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("inconsistent-gold-issues");
  });
  it("summarizes explicit score metrics independently of baseline", () => {
    const input = completeGateInput();
    const explicit = input.scores.filter((score) => score.mode === "explicit");
    explicit[0] = {
      ...(explicit[0] as V02EvalScore),
      naturalness: 0,
      unnecessaryRewrite: true,
      formatViolation: true,
      goldIssuesCorrected: 0,
    };

    expect(summarizeV02Scores(explicit)).toMatchObject({
      average: 9.98,
      unnecessaryRewriteRate: 0.01,
      formatAdherenceRate: 0.99,
      goldCorrectionRate: 0.99,
    });
  });
});
