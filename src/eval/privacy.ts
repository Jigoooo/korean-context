import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export type PrivacyViolationRule =
  | "windows-user-path"
  | "wsl-user-path"
  | "posix-user-path"
  | "private-repository"
  | "private-branch";

export type PrivacyViolation = {
  source: string;
  line: number;
  rule: PrivacyViolationRule;
};

const privacyPatterns: ReadonlyArray<{
  rule: PrivacyViolationRule;
  pattern: RegExp;
}> = [
  {
    rule: "windows-user-path",
    pattern: /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"']+/iu,
  },
  {
    rule: "wsl-user-path",
    pattern: /(?:\\{2,}|\/{2,})wsl(?:\.localhost|\$)[\\/]+/iu,
  },
  {
    rule: "posix-user-path",
    pattern: /\/(?:home|Users)\/[^/\s"']+/u,
  },
  { rule: "private-repository", pattern: /\boffen-asm-mvp\b/iu },
  { rule: "private-branch", pattern: /\bfeat\/dashboard-widgets\b/iu },
];

export function redactPrivateText(text: string): string {
  return text
    .replace(
      /(?:\\{2,}|\/{2,})wsl(?:\.localhost|\$)[\\/]+[^\\/\s"']+[\\/]+home[\\/]+[^\\/\s"']+/giu,
      "<redacted-wsl-path>",
    )
    .replace(
      /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"']+/giu,
      "<redacted-user-path>",
    )
    .replace(/\/(?:home|Users)\/[^/\s"']+/gu, "<redacted-user-path>")
    .replace(/\boffen-asm-mvp\b/giu, "<redacted-repository>")
    .replace(/\bfeat\/dashboard-widgets\b/giu, "<redacted-branch>");
}
export function findPrivacyViolations(
  text: string,
  source: string,
): PrivacyViolation[] {
  const violations: PrivacyViolation[] = [];
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    for (const { rule, pattern } of privacyPatterns) {
      if (pattern.test(line)) {
        violations.push({ source, line: index + 1, rule });
      }
    }
  }
  return violations;
}

const collectFiles = async (directory: string): Promise<string[]> => {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
};

const publicDirectories = [
  join("evals", "cases", "v0.2"),
  join("evals", "fixtures", "v0.2"),
  join("evals", "results", "v0.2"),
] as const;

export async function validatePublicV02Artifacts(root: string): Promise<void> {
  const files = (
    await Promise.all(
      publicDirectories.map((directory) => collectFiles(join(root, directory))),
    )
  )
    .flat()
    .sort();
  const violations: PrivacyViolation[] = [];

  for (const path of files) {
    const source = relative(root, path).split(sep).join("/");
    violations.push(
      ...findPrivacyViolations(await readFile(path, "utf8"), source),
    );
  }

  if (violations.length > 0) {
    throw new Error(
      [
        "Public v0.2 privacy validation failed:",
        ...violations.map(
          (violation) =>
            `${violation.source}:${violation.line} [${violation.rule}]`,
        ),
      ].join("\n"),
    );
  }
}
