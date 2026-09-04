import { z } from "zod";

import { domains, evalKinds, registers, surfaces } from "./types.js";

export const v02ScenarioTypes = [
  "real-world-repair",
  "preserve",
  "project-conflict",
  "long-artifact",
  "format",
  "boundary",
] as const;

export const v02RequiredFormats = [
  "single-line",
  "bullet-list",
  "markdown-table",
  "commit-subject",
  "exact-output",
] as const;

export type V02ScenarioType = (typeof v02ScenarioTypes)[number];
export type V02RequiredFormat = (typeof v02RequiredFormats)[number];

export const AutomaticChecksSchema = z
  .object({
    requiredSubstrings: z.array(z.string().min(1)),
    forbiddenSubstrings: z.array(z.string().min(1)),
    requiredPatterns: z.array(z.string().min(1)),
    forbiddenPatterns: z.array(z.string().min(1)),
  })
  .strict();

export const V02EvalCaseSchema = z
  .object({
    schemaVersion: z.literal("0.2"),
    id: z
      .string()
      .regex(
        /^v02-(real-world-repair|preserve|project-conflict|long-artifact|format|boundary)-\d{3}$/u,
      ),
    kind: z.enum(evalKinds),
    scenarioType: z.enum(v02ScenarioTypes),
    surface: z.enum(surfaces),
    domain: z.enum(domains),
    input: z.string().min(1),
    expectedBehavior: z.array(z.string().min(1)).min(1),
    forbiddenBehavior: z.array(z.string().min(1)),
    protectedTokens: z.array(z.string().min(1)),
    protectedFacts: z.array(z.string().min(1)).min(1),
    expectedRegister: z.enum(registers),
    projectVocabulary: z
      .object({
        preferred: z.array(z.string().min(1)),
        accepted: z.array(z.string().min(1)),
        forbidden: z.array(z.string().min(1)),
      })
      .strict(),
    requiredFormat: z.array(z.enum(v02RequiredFormats)),
    automaticChecks: AutomaticChecksSchema,
    provenance: z.enum(["anonymized-derived", "synthetic"]),
    sourceIds: z.array(z.string().min(1)).min(1),
    repeatCount: z.union([z.literal(1), z.literal(3)]),
    privacyReviewed: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.id.startsWith(`v02-${value.scenarioType}-`)) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: `Case id ${value.id} does not match scenario ${value.scenarioType}`,
      });
    }
  });

export const V02SuiteManifestSchema = z
  .object({
    schemaVersion: z.literal("0.2"),
    totalCases: z.literal(60),
    repeatedCases: z.literal(20),
    files: z
      .array(
        z
          .object({
            path: z.string().regex(/^[a-z0-9-]+\.jsonl$/u),
            scenarioType: z.enum(v02ScenarioTypes),
            count: z.number().int().positive(),
          })
          .strict(),
      )
      .length(6),
  })
  .strict();

export type V02EvalCase = z.infer<typeof V02EvalCaseSchema>;
export type V02SuiteManifest = z.infer<typeof V02SuiteManifestSchema>;
