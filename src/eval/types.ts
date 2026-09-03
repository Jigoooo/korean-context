export const evalKinds = [
  "repair",
  "generation",
  "preserve",
  "conflict",
  "transfer",
  "boundary",
] as const;

export const surfaces = [
  "commit",
  "pr",
  "issue",
  "review",
  "comment",
  "docs",
  "ui",
  "error",
  "test",
  "release",
  "conversation",
] as const;

export const domains = [
  "software",
  "frontend",
  "backend",
  "infra",
  "security-common",
  "security-appsec",
  "security-vulnerability",
  "security-pentest-redteam",
] as const;

export const registers = [
  "해요체",
  "합니다체",
  "한다체",
  "phrase",
  "unchanged",
] as const;

export type EvalKind = (typeof evalKinds)[number];
export type Surface = (typeof surfaces)[number];
export type Domain = (typeof domains)[number];
export type Register = (typeof registers)[number];
