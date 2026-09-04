import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { z } from "zod";

import type {
  AutomaticEvaluation,
  AutomaticViolationRule,
} from "./hard-failures.js";
import type { V02EvalCase } from "./v02-schema.js";
import { v02Modes, type V02EvalRun } from "./v02-result-schema.js";

const points = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const V02EvalScoreSchema = z
  .object({
    suite: z.literal("v0.2"),
    caseId: z.string().min(1),
    mode: z.enum(v02Modes),
    attempt: z.number().int().min(1).max(3),
    naturalness: points,
    terminology: points,
    meaningPreservation: points,
    surfaceFit: points,
    translationese: points,
    technicalMeaningChange: z.boolean(),
    inventedFact: z.boolean(),
    projectVocabularyViolation: z.boolean(),
    protectedContentViolation: z.boolean(),
    formatViolation: z.boolean(),
    boundaryViolation: z.boolean(),
    unnecessaryRewrite: z.boolean(),
    improvedOverBaseline: z.boolean(),
    goldIssuesTotal: z.number().int().nonnegative(),
    goldIssuesCorrected: z.number().int().nonnegative(),
    notes: z.string().min(1),
  })
  .strict()
  .refine(
    (score) => score.goldIssuesCorrected <= score.goldIssuesTotal,
    "goldIssuesCorrected cannot exceed goldIssuesTotal",
  )
  .refine(
    (score) => score.mode !== "baseline" || !score.improvedOverBaseline,
    "baseline score cannot improve over baseline",
  );

export type V02EvalScore = z.infer<typeof V02EvalScoreSchema>;
export type ScoreV02Options = {
  manifestPath: string;
  baselineRunsPath: string;
  explicitRunsPath: string;
  scoresPath: string;
  v01RegressionRunsPath: string;
  outputPath: string;
};

const scoreOptionNames = [
  "--manifest",
  "--baseline-runs",
  "--explicit-runs",
  "--scores",
  "--v01-regression-runs",
  "--output",
] as const;

export function parseScoreV02Arguments(
  args: string[],
  currentDirectory: string,
): ScoreV02Options {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (
      !option ||
      !scoreOptionNames.includes(option as (typeof scoreOptionNames)[number])
    ) {
      throw new Error(`Unknown option: ${option}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}`);
    }
    values.set(option, value);
    index += 1;
  }

  const root = resolve(currentDirectory);
  const resultRoot = join("evals", "results", "v0.2");
  return {
    manifestPath: resolve(
      root,
      values.get("--manifest") ?? "evals/cases/v0.2/manifest.json",
    ),
    baselineRunsPath: resolve(
      root,
      values.get("--baseline-runs") ??
        join(resultRoot, "baseline", "runs.jsonl"),
    ),
    explicitRunsPath: resolve(
      root,
      values.get("--explicit-runs") ??
        join(resultRoot, "explicit", "runs.jsonl"),
    ),
    scoresPath: resolve(
      root,
      values.get("--scores") ?? join(resultRoot, "scores", "scores.jsonl"),
    ),
    v01RegressionRunsPath: resolve(
      root,
      values.get("--v01-regression-runs") ??
        join(resultRoot, "v0.1-regression", "runs.jsonl"),
    ),
    outputPath: resolve(
      root,
      values.get("--output") ?? join(resultRoot, "gate.json"),
    ),
  };
}

export async function loadV02Scores(path: string): Promise<V02EvalScore[]> {
  const contents = await readFile(path, "utf8");
  const scores: V02EvalScore[] = [];
  for (const [index, line] of contents.split(/\r?\n/u).entries()) {
    if (line.trim() === "") {
      continue;
    }
    let input: unknown;
    try {
      input = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`Invalid JSON at ${path}:${index + 1}`);
    }
    try {
      scores.push(V02EvalScoreSchema.parse(input));
    } catch {
      throw new Error(`Invalid score at ${path}:${index + 1}`);
    }
  }
  return scores;
}

export type V02ReleaseGateInput = {
  cases: V02EvalCase[];
  baselineRuns: V02EvalRun[];
  explicitRuns: V02EvalRun[];
  v01RegressionRuns: V02EvalRun[];
  automaticEvaluations: AutomaticEvaluation[];
  scores: V02EvalScore[];
};

export type V02GateResult = {
  passed: boolean;
  reasons: string[];
  average: number;
  hardFailures: number;
  unnecessaryRewriteRate: number;
  formatAdherenceRate: number;
  goldCorrectionRate: number;
  repeatedHardFailureVariance: number;
};

const evaluationKey = (item: {
  caseId: string;
  mode: "baseline" | "explicit";
  attempt: number;
}) => JSON.stringify([item.caseId, item.mode, item.attempt]);

const hasManualHardFailure = (score: V02EvalScore) =>
  score.technicalMeaningChange ||
  score.inventedFact ||
  score.projectVocabularyViolation ||
  score.protectedContentViolation ||
  score.boundaryViolation;

const scorePoints = (score: V02EvalScore) =>
  score.naturalness +
  score.terminology +
  score.meaningPreservation +
  score.surfaceFit +
  score.translationese;

const metricsFor = (
  scores: V02EvalScore[],
  hardFailureKeys: Set<string>,
  formatFailureKeys: Set<string>,
  repeatedHardFailureVariance: number,
): Omit<V02GateResult, "passed" | "reasons"> => {
  if (scores.length === 0) {
    throw new Error("No v0.2 evaluation scores");
  }
  const totalGold = scores.reduce(
    (sum, score) => sum + score.goldIssuesTotal,
    0,
  );
  const correctedGold = scores.reduce(
    (sum, score) =>
      sum +
      (hardFailureKeys.has(evaluationKey(score))
        ? 0
        : score.goldIssuesCorrected),
    0,
  );
  return {
    average:
      scores.reduce((sum, score) => sum + scorePoints(score), 0) /
      scores.length,
    hardFailures: hardFailureKeys.size,
    unnecessaryRewriteRate:
      scores.filter((score) => score.unnecessaryRewrite).length / scores.length,
    formatAdherenceRate: 1 - formatFailureKeys.size / scores.length,
    goldCorrectionRate: totalGold === 0 ? 0 : correctedGold / totalGold,
    repeatedHardFailureVariance,
  };
};

const thresholdReasons = (
  metrics: Omit<V02GateResult, "passed" | "reasons">,
) => {
  const reasons: string[] = [];
  if (metrics.hardFailures > 0) {
    reasons.push("explicit-hard-failure");
  }
  if (metrics.unnecessaryRewriteRate > 0.05) {
    reasons.push("unnecessary-rewrite-rate");
  }
  if (metrics.formatAdherenceRate < 0.95) {
    reasons.push("format-adherence-rate");
  }
  if (metrics.goldCorrectionRate < 0.9) {
    reasons.push("gold-correction-rate");
  }
  if (metrics.repeatedHardFailureVariance > 0) {
    reasons.push("repeated-hard-failure-variance");
  }
  return reasons;
};

const scoreHardFailureKeys = (scores: V02EvalScore[]) =>
  new Set(
    scores.filter(hasManualHardFailure).map((score) => evaluationKey(score)),
  );

const scoreFormatFailureKeys = (scores: V02EvalScore[]) =>
  new Set(
    scores
      .filter((score) => score.formatViolation)
      .map((score) => evaluationKey(score)),
  );

const repeatedVarianceFromScores = (
  scores: V02EvalScore[],
  hardFailureKeys: Set<string>,
) => {
  const attemptsByCase = new Map<string, string[]>();
  for (const score of scores) {
    const keys = attemptsByCase.get(score.caseId) ?? [];
    keys.push(evaluationKey(score));
    attemptsByCase.set(score.caseId, keys);
  }
  return [...attemptsByCase.values()].filter((keys) => {
    if (keys.length < 2) {
      return false;
    }
    const outcomes = keys.map((key) => hardFailureKeys.has(key));
    return outcomes.some(Boolean) && outcomes.some((failed) => !failed);
  }).length;
};

export function summarizeV02Scores(scores: V02EvalScore[]): V02GateResult {
  const hardFailureKeys = scoreHardFailureKeys(scores);
  const metrics = metricsFor(
    scores,
    hardFailureKeys,
    scoreFormatFailureKeys(scores),
    repeatedVarianceFromScores(scores, hardFailureKeys),
  );
  const reasons = thresholdReasons(metrics);
  return { passed: reasons.length === 0, reasons, ...metrics };
}

const expectedKeysFor = (cases: V02EvalCase[], mode: "baseline" | "explicit") =>
  new Set(
    cases.flatMap((evalCase) =>
      Array.from({ length: evalCase.repeatCount }, (_, index) =>
        evaluationKey({ caseId: evalCase.id, mode, attempt: index + 1 }),
      ),
    ),
  );

const setEquals = (left: Set<string>, right: Set<string>) =>
  left.size === right.size && [...left].every((item) => right.has(item));

const runKeys = (runs: V02EvalRun[]) =>
  new Set(runs.map((run) => evaluationKey(run)));

const oneConfiguration = (runs: V02EvalRun[]) => {
  const configurations = new Set(
    runs.map((run) =>
      JSON.stringify([
        run.codexVersion,
        run.model,
        run.reasoningEffort,
        run.pluginVersion,
        run.fixtureHash,
        run.memoryIsolation,
        run.disabledMcpServers,
      ]),
    ),
  );
  return configurations.size === 1;
};

const comparableConfiguration = (run: V02EvalRun) =>
  JSON.stringify([
    run.codexVersion,
    run.model,
    run.reasoningEffort,
    run.fixtureHash,
    run.memoryIsolation,
    run.disabledMcpServers,
  ]);

const comparableLegacyConfiguration = (run: V02EvalRun) =>
  JSON.stringify([
    run.codexVersion,
    run.model,
    run.reasoningEffort,
    run.pluginVersion,
    run.memoryIsolation,
    run.disabledMcpServers,
  ]);

const isSuccessfulRun = (run: V02EvalRun) =>
  run.status === "completed" && run.exitCode === 0 && run.output.trim() !== "";

const automaticHardRules = new Set<AutomaticViolationRule>([
  "run-status",
  "empty-output",
  "protected-token",
  "required-substring",
  "forbidden-substring",
  "required-pattern",
  "forbidden-pattern",
  "project-vocabulary",
]);

const containsAutomaticRule = (
  evaluation: AutomaticEvaluation,
  rules: Set<AutomaticViolationRule>,
) => evaluation.violations.some((violation) => rules.has(violation.rule));

export function evaluateV02ReleaseGate(
  input: V02ReleaseGateInput,
): V02GateResult {
  const reasons: string[] = [];
  const addReason = (reason: string) => {
    if (!reasons.includes(reason)) {
      reasons.push(reason);
    }
  };
  const expectedBaseline = expectedKeysFor(input.cases, "baseline");
  const expectedExplicit = expectedKeysFor(input.cases, "explicit");
  const expectedAll = new Set([...expectedBaseline, ...expectedExplicit]);

  if (
    !setEquals(runKeys(input.baselineRuns), expectedBaseline) ||
    !setEquals(runKeys(input.explicitRuns), expectedExplicit)
  ) {
    addReason("missing-attempt");
  }

  const baselineFirst = input.baselineRuns[0];
  const explicitFirst = input.explicitRuns[0];
  const legacyFirst = input.v01RegressionRuns[0];
  if (
    !baselineFirst ||
    !explicitFirst ||
    !legacyFirst ||
    !oneConfiguration(input.baselineRuns) ||
    !oneConfiguration(input.explicitRuns) ||
    !oneConfiguration(input.v01RegressionRuns) ||
    baselineFirst.pluginVersion !== null ||
    explicitFirst.pluginVersion === null ||
    comparableConfiguration(baselineFirst) !==
      comparableConfiguration(explicitFirst) ||
    comparableLegacyConfiguration(explicitFirst) !==
      comparableLegacyConfiguration(legacyFirst)
  ) {
    addReason("mixed-configuration");
  }

  const legacyKeys = new Set(input.v01RegressionRuns.map((run) => run.caseId));
  if (
    input.v01RegressionRuns.length !== 100 ||
    legacyKeys.size !== 100 ||
    input.v01RegressionRuns.some(
      (run) =>
        run.suite !== "v0.1-regression" ||
        run.mode !== "explicit" ||
        run.attempt !== 1 ||
        !isSuccessfulRun(run),
    )
  ) {
    addReason("v0.1-regression");
  }

  const automaticKeys = new Set(
    input.automaticEvaluations.map((evaluation) => evaluationKey(evaluation)),
  );
  if (!setEquals(automaticKeys, expectedAll)) {
    addReason("missing-automatic-evaluation");
  }
  if (automaticKeys.size !== input.automaticEvaluations.length) {
    addReason("duplicate-automatic-evaluation");
  }

  const scoreKeys = new Set(input.scores.map((score) => evaluationKey(score)));
  if (!setEquals(scoreKeys, expectedAll)) {
    addReason("missing-score");
  }
  if (scoreKeys.size !== input.scores.length) {
    addReason("duplicate-score");
  }
  const goldTotals = new Map<string, number>();
  for (const score of input.scores) {
    const existing = goldTotals.get(score.caseId);
    if (existing === undefined) {
      goldTotals.set(score.caseId, score.goldIssuesTotal);
    } else if (existing !== score.goldIssuesTotal) {
      addReason("inconsistent-gold-issues");
    }
  }

  const infrastructureRules = new Set<AutomaticViolationRule>([
    "run-status",
    "empty-output",
  ]);
  if (
    input.baselineRuns.some((run) => !isSuccessfulRun(run)) ||
    input.automaticEvaluations.some(
      (evaluation) =>
        evaluation.mode === "baseline" &&
        containsAutomaticRule(evaluation, infrastructureRules),
    )
  ) {
    addReason("baseline-infrastructure");
  }

  const explicitScoreKeys = expectedExplicit;
  const explicitScores = input.scores.filter(
    (score) =>
      score.mode === "explicit" && explicitScoreKeys.has(evaluationKey(score)),
  );

  const hardFailureKeys = scoreHardFailureKeys(explicitScores);
  const formatFailureKeys = scoreFormatFailureKeys(explicitScores);
  for (const run of input.explicitRuns) {
    if (!isSuccessfulRun(run)) {
      hardFailureKeys.add(evaluationKey(run));
    }
  }
  for (const evaluation of input.automaticEvaluations) {
    if (evaluation.mode !== "explicit") {
      continue;
    }
    const key = evaluationKey(evaluation);
    if (containsAutomaticRule(evaluation, automaticHardRules)) {
      hardFailureKeys.add(key);
    }
    if (
      evaluation.violations.some(
        (violation) => violation.rule === "required-format",
      )
    ) {
      formatFailureKeys.add(key);
    }
  }

  const repeatedHardFailureVariance = input.cases
    .filter((evalCase) => evalCase.repeatCount === 3)
    .filter((evalCase) => {
      const outcomes = [1, 2, 3].map((attempt) =>
        hardFailureKeys.has(
          evaluationKey({
            caseId: evalCase.id,
            mode: "explicit",
            attempt,
          }),
        ),
      );
      return outcomes.some(Boolean) && outcomes.some((failed) => !failed);
    }).length;

  const metrics =
    explicitScores.length === 0
      ? {
          average: 0,
          hardFailures: hardFailureKeys.size,
          unnecessaryRewriteRate: 0,
          formatAdherenceRate: 0,
          goldCorrectionRate: 0,
          repeatedHardFailureVariance,
        }
      : metricsFor(
          explicitScores,
          hardFailureKeys,
          formatFailureKeys,
          repeatedHardFailureVariance,
        );
  for (const reason of thresholdReasons(metrics)) {
    addReason(reason);
  }

  return { passed: reasons.length === 0, reasons, ...metrics };
}
