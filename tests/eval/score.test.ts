import { describe, expect, it } from "vitest";

import { summarizeScores, type EvalScore } from "../../src/eval/score.js";

const passingScore = (caseId: string): EvalScore => ({
  caseId,
  mode: "explicit",
  naturalness: 2,
  terminology: 2,
  meaningPreservation: 2,
  surfaceFit: 2,
  translationese: 2,
  technicalCorruption: false,
  severeTerminologyError: false,
  boundaryViolation: false,
  unnecessaryRewrite: false,
  improvedOverBaseline: true,
  notes: "검토 완료",
});

describe("release score summary", () => {
  it("counts hard failures and computes the average", () => {
    const scores = [
      passingScore("repair-001"),
      {
        ...passingScore("repair-002"),
        naturalness: 0,
        technicalCorruption: true,
      },
    ] satisfies EvalScore[];

    expect(summarizeScores(scores)).toMatchObject({
      average: 9,
      technicalCorruptions: 1,
      severeTerminologyErrors: 0,
      boundaryViolations: 0,
    });
  });

  it("rejects incomplete score sets", () => {
    expect(() => summarizeScores([])).toThrow("No evaluation scores");
  });
});
