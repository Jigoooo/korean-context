import { z } from "zod";

export const SourceRecordSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.url().or(z.string().startsWith("local:")),
  checkedAt: z.literal("2026-09-03"),
  category: z.enum(["existing-skill", "engineering", "ux", "security"]),
  originalLanguage: z.enum(["ko", "translated", "unknown"]),
  authorType: z.enum(["practitioner", "vendor", "official-org", "community"]),
  surface: z.array(z.string().min(1)).min(1),
  domain: z.array(z.string().min(1)).min(1),
  finding: z.string().min(20),
  decision: z.enum(["reuse", "adapt", "reject"]),
  generalizedRule: z.string().min(20),
  exceptions: z.array(z.string().min(1)),
  evalIds: z.array(z.string().min(1)),
});

export type SourceRecord = z.infer<typeof SourceRecordSchema>;
