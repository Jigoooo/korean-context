import { z } from "zod";

import { evalModes } from "./result-schema.js";

const points = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const EvalScoreSchema = z.object({
  caseId: z.string().min(1),
  mode: z.enum(evalModes),
  naturalness: points,
  terminology: points,
  meaningPreservation: points,
  surfaceFit: points,
  translationese: points,
  technicalCorruption: z.boolean(),
  severeTerminologyError: z.boolean(),
  boundaryViolation: z.boolean(),
  unnecessaryRewrite: z.boolean(),
  improvedOverBaseline: z.boolean(),
  notes: z.string().min(1),
});

export type EvalScore = z.infer<typeof EvalScoreSchema>;

export type GateSummary = {
  total: number;
  average: number;
  technicalCorruptions: number;
  severeTerminologyErrors: number;
  boundaryViolations: number;
  unnecessaryRewrites: number;
  improvedOverBaseline: number;
};

export function summarizeScores(scores: EvalScore[]): GateSummary {
  if (scores.length === 0) {
    throw new Error("No evaluation scores");
  }

  const totalPoints = scores.reduce(
    (sum, score) =>
      sum +
      score.naturalness +
      score.terminology +
      score.meaningPreservation +
      score.surfaceFit +
      score.translationese,
    0,
  );
  const count = (select: (score: EvalScore) => boolean) =>
    scores.filter(select).length;

  return {
    total: scores.length,
    average: totalPoints / scores.length,
    technicalCorruptions: count((score) => score.technicalCorruption),
    severeTerminologyErrors: count((score) => score.severeTerminologyError),
    boundaryViolations: count((score) => score.boundaryViolation),
    unnecessaryRewrites: count((score) => score.unnecessaryRewrite),
    improvedOverBaseline: count((score) => score.improvedOverBaseline),
  };
}
