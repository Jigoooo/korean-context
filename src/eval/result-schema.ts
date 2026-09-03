import { z } from "zod";

import { evalKinds } from "./types.js";

export const evalModes = ["baseline", "explicit", "implicit"] as const;
export type EvalMode = (typeof evalModes)[number];

export const EvalRunSchema = z.object({
  caseId: z.string(),
  kind: z.enum(evalKinds),
  mode: z.enum(evalModes),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  codexVersion: z.string().min(1),
  model: z.string().nullable(),
  exitCode: z.number().int(),
  output: z.string(),
  stderr: z.string(),
});

export type EvalRun = z.infer<typeof EvalRunSchema>;
