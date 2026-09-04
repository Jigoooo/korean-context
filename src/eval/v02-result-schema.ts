import { z } from "zod";

export const v02Modes = ["baseline", "explicit"] as const;
export const evaluationSuites = ["v0.2", "v0.1-regression"] as const;
export const v02RunStatuses = [
  "completed",
  "failed",
  "timeout",
  "interrupted",
] as const;

export type V02Mode = (typeof v02Modes)[number];
export type EvaluationSuite = (typeof evaluationSuites)[number];
export type V02RunStatus = (typeof v02RunStatuses)[number];

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);

export const V02RunManifestSchema = z
  .object({
    suite: z.enum(evaluationSuites),
    mode: z.enum(v02Modes),
    codexVersion: z.string().min(1),
    model: z.string().min(1),
    reasoningEffort: z.string().min(1),
    pluginVersion: z.string().min(1).nullable(),
    fixtureHash: sha256,
    memoryIsolation: z.literal("disabled"),
    createdAt: z.iso.datetime(),
  })
  .strict();

export const V02EvalRunSchema = z
  .object({
    suite: z.enum(evaluationSuites),
    caseId: z.string().min(1),
    mode: z.enum(v02Modes),
    attempt: z.number().int().min(1).max(3),
    status: z.enum(v02RunStatuses),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
    codexVersion: z.string().min(1),
    model: z.string().min(1),
    reasoningEffort: z.string().min(1),
    pluginVersion: z.string().min(1).nullable(),
    fixtureHash: sha256,
    memoryIsolation: z.literal("disabled"),
    promptHash: sha256,
    exitCode: z.number().int(),
    output: z.string(),
    stderr: z.string(),
  })
  .strict();

export type V02RunManifest = z.infer<typeof V02RunManifestSchema>;
export type V02EvalRun = z.infer<typeof V02EvalRunSchema>;
