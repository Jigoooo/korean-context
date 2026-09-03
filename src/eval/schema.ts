import { z } from "zod";

import { domains, evalKinds, registers, surfaces } from "./types.js";

export const EvalCaseSchema = z.object({
  id: z
    .string()
    .regex(/^(repair|generation|preserve|conflict|transfer|boundary)-\d{3}$/),
  kind: z.enum(evalKinds),
  surface: z.enum(surfaces),
  domain: z.enum(domains),
  input: z.string().min(1),
  expectedBehavior: z.array(z.string().min(1)).min(1),
  forbiddenBehavior: z.array(z.string().min(1)),
  protectedTokens: z.array(z.string().min(1)),
  expectedRegister: z.enum(registers),
  sourceIds: z.array(z.string().min(1)).min(1),
  live: z.boolean(),
});

export type EvalCase = z.infer<typeof EvalCaseSchema>;
