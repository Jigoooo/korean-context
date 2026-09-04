import type { V02EvalCase, V02RequiredFormat } from "./v02-schema.js";
import type { V02EvalRun, V02Mode } from "./v02-result-schema.js";

export type AutomaticViolationRule =
  | "run-status"
  | "empty-output"
  | "protected-token"
  | "required-substring"
  | "forbidden-substring"
  | "required-pattern"
  | "forbidden-pattern"
  | "project-vocabulary"
  | "required-format";

export type AutomaticViolation = {
  rule: AutomaticViolationRule;
  detail: string;
};

export type AutomaticEvaluation = {
  caseId: string;
  mode: V02Mode;
  attempt: number;
  passed: boolean;
  violations: AutomaticViolation[];
};

const compilePattern = (
  pattern: string,
  kind: "required" | "forbidden",
  caseId: string,
): RegExp => {
  try {
    return new RegExp(pattern, "u");
  } catch {
    throw new Error(`Invalid ${kind} pattern in ${caseId}: ${pattern}`);
  }
};

export function validateAutomaticCheckDefinitions(evalCase: V02EvalCase): void {
  for (const pattern of evalCase.automaticChecks.requiredPatterns) {
    compilePattern(pattern, "required", evalCase.id);
  }
  for (const pattern of evalCase.automaticChecks.forbiddenPatterns) {
    compilePattern(pattern, "forbidden", evalCase.id);
  }
  if (
    evalCase.requiredFormat.includes("exact-output") &&
    evalCase.automaticChecks.requiredSubstrings.length !== 1
  ) {
    throw new Error(
      `exact-output requires exactly one required substring in ${evalCase.id}`,
    );
  }
}

const isSingleLine = (output: string) =>
  output.trim() !== "" && !/[\r\n]/u.test(output);

const isBulletList = (output: string) => {
  const lines = output.split(/\r?\n/u);
  return (
    lines.length > 0 && lines.every((line) => /^\s*[-*+]\s+\S/u.test(line))
  );
};

const tableCells = (line: string) => {
  const trimmed = line.trim().replace(/^\|/u, "").replace(/\|$/u, "");
  return trimmed.split("|").map((cell) => cell.trim());
};

const isMarkdownTable = (output: string) => {
  const lines = output.split(/\r?\n/u);
  if (lines.length < 2 || lines.some((line) => line.trim() === "")) {
    return false;
  }
  const header = tableCells(lines[0] as string);
  const delimiter = tableCells(lines[1] as string);
  if (
    header.length < 2 ||
    delimiter.length !== header.length ||
    !delimiter.every((cell) => /^:?-{3,}:?$/u.test(cell))
  ) {
    return false;
  }
  return lines
    .slice(2)
    .every((line) => tableCells(line).length === header.length);
};

const isCommitSubject = (output: string) =>
  isSingleLine(output) &&
  output.trim() === output &&
  output !== "" &&
  !/^(?:[-*+>]\s|#{1,6}\s|```|\d+[.)]\s)/u.test(output);

const matchesRequiredFormat = (
  format: V02RequiredFormat,
  output: string,
  evalCase: V02EvalCase,
) => {
  switch (format) {
    case "single-line":
      return isSingleLine(output);
    case "bullet-list":
      return isBulletList(output);
    case "markdown-table":
      return isMarkdownTable(output);
    case "commit-subject":
      return isCommitSubject(output);
    case "exact-output":
      return output === evalCase.automaticChecks.requiredSubstrings[0];
  }
};

export function evaluateAutomaticChecks(
  evalCase: V02EvalCase,
  run: V02EvalRun,
): AutomaticEvaluation {
  validateAutomaticCheckDefinitions(evalCase);
  const violations: AutomaticViolation[] = [];
  const add = (rule: AutomaticViolationRule, detail: string) => {
    violations.push({ rule, detail });
  };

  if (run.status !== "completed" || run.exitCode !== 0) {
    add(
      "run-status",
      `Run status ${run.status} with exit code ${run.exitCode}`,
    );
  }
  if (run.output.trim() === "") {
    add("empty-output", "Output is empty");
  }
  for (const token of evalCase.protectedTokens) {
    if (!run.output.includes(token)) {
      add("protected-token", `Missing protected token: ${token}`);
    }
  }
  for (const substring of evalCase.automaticChecks.requiredSubstrings) {
    if (!run.output.includes(substring)) {
      add("required-substring", `Missing required substring: ${substring}`);
    }
  }
  for (const substring of evalCase.automaticChecks.forbiddenSubstrings) {
    if (run.output.includes(substring)) {
      add("forbidden-substring", `Found forbidden substring: ${substring}`);
    }
  }
  for (const pattern of evalCase.automaticChecks.requiredPatterns) {
    if (!compilePattern(pattern, "required", evalCase.id).test(run.output)) {
      add("required-pattern", `Required pattern did not match: ${pattern}`);
    }
  }
  for (const pattern of evalCase.automaticChecks.forbiddenPatterns) {
    if (compilePattern(pattern, "forbidden", evalCase.id).test(run.output)) {
      add("forbidden-pattern", `Forbidden pattern matched: ${pattern}`);
    }
  }
  for (const term of evalCase.projectVocabulary.forbidden) {
    if (run.output.includes(term)) {
      add("project-vocabulary", `Forbidden project term: ${term}`);
    }
  }
  for (const format of evalCase.requiredFormat) {
    if (!matchesRequiredFormat(format, run.output, evalCase)) {
      add("required-format", `Required format not satisfied: ${format}`);
    }
  }

  return {
    caseId: run.caseId,
    mode: run.mode,
    attempt: run.attempt,
    passed: violations.length === 0,
    violations,
  };
}
