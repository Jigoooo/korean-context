import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findPrivacyViolations,
  redactPrivateText,
  validatePublicV02Artifacts,
} from "../../src/eval/privacy.js";
import { V02EvalCaseSchema } from "../../src/eval/v02-schema.js";

describe("public v0.2 privacy validation", () => {
  it.each([
    ["windows-user-path", String.raw`C:\Users\alice\project`],
    [
      "wsl-user-path",
      String.raw`\\wsl.localhost\Ubuntu\home\alice\private-repo`,
    ],
    ["posix-user-path", "/home/alice/private-repo"],
    ["private-repository", "offen-asm-mvp"],
    ["private-branch", "feat/dashboard-widgets"],
  ] as const)("detects %s", (rule, text) => {
    expect(findPrivacyViolations(text, "fixture.txt")).toEqual([
      { source: "fixture.txt", line: 1, rule },
    ]);
  });

  it("allows portable synthetic paths and approved fixture vocabulary", () => {
    expect(
      findPrivacyViolations(
        "<workspace>/packages/client에서 위젯과 서랍 문구를 확인한다.",
        "fixture.txt",
      ),
    ).toEqual([]);
  });

  it.each([
    String.raw`C:\Users\alice\.codex\logs`,
    String.raw`\\wsl.localhost\Ubuntu\home\alice\repo`,
    "/home/alice/repo",
    "offen-asm-mvp feat/dashboard-widgets",
  ])(
    "redacts private infrastructure text before public storage: %s",
    (text) => {
      const redacted = redactPrivateText(`warning: ${text}`);

      expect(findPrivacyViolations(redacted, "stderr")).toEqual([]);
      expect(redacted).not.toContain("alice");
      expect(redacted).toContain("<redacted-");
    },
  );
  it("reports each matching line without copying private text", () => {
    const violations = findPrivacyViolations(
      ["안전한 첫 줄", String.raw`C:\Users\alice\secret`].join("\n"),
      "evals/cases/v0.2/repair.jsonl",
    );

    expect(violations).toEqual([
      {
        source: "evals/cases/v0.2/repair.jsonl",
        line: 2,
        rule: "windows-user-path",
      },
    ]);
    expect(JSON.stringify(violations)).not.toContain("alice");
    expect(JSON.stringify(violations)).not.toContain("secret");
  });

  it("scans cases, fixtures, and committed results recursively", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-privacy-"));
    try {
      const caseDirectory = join(root, "evals", "cases", "v0.2");
      const fixtureDirectory = join(
        root,
        "evals",
        "fixtures",
        "v0.2",
        "anonymized-workspace",
        "src",
      );
      const resultDirectory = join(root, "evals", "results", "v0.2");
      await Promise.all([
        mkdir(caseDirectory, { recursive: true }),
        mkdir(fixtureDirectory, { recursive: true }),
        mkdir(resultDirectory, { recursive: true }),
      ]);
      await Promise.all([
        writeFile(join(caseDirectory, "repair.jsonl"), "{}\n", "utf8"),
        writeFile(
          join(fixtureDirectory, "copy.ts"),
          ["export const safe = true;", "", "/home/alice/private-repo"].join(
            "\n",
          ),
          "utf8",
        ),
        writeFile(join(resultDirectory, "summary.json"), "{}\n", "utf8"),
      ]);

      await expect(validatePublicV02Artifacts(root)).rejects.toThrow(
        "evals/fixtures/v0.2/anonymized-workspace/src/copy.ts:3 [posix-user-path]",
      );
      await expect(validatePublicV02Artifacts(root)).rejects.not.toThrow(
        /alice|private-repo/u,
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("accepts a recursively scanned public tree without violations", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-privacy-safe-"));
    try {
      const fixtureDirectory = join(
        root,
        "evals",
        "fixtures",
        "v0.2",
        "anonymized-workspace",
      );
      await mkdir(fixtureDirectory, { recursive: true });
      await writeFile(
        join(fixtureDirectory, "README.md"),
        "<workspace>/src의 위젯 문구를 검토한다.\n",
        "utf8",
      );

      await expect(validatePublicV02Artifacts(root)).resolves.toBeUndefined();
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("rejects cases that were not explicitly privacy-reviewed", () => {
    const result = V02EvalCaseSchema.safeParse({
      schemaVersion: "0.2",
      id: "v02-preserve-001",
      kind: "preserve",
      scenarioType: "preserve",
      surface: "docs",
      domain: "software",
      input: "입력",
      expectedBehavior: ["보존한다"],
      forbiddenBehavior: [],
      protectedTokens: [],
      protectedFacts: ["의미를 보존한다"],
      expectedRegister: "unchanged",
      projectVocabulary: { preferred: [], accepted: [], forbidden: [] },
      requiredFormat: ["exact-output"],
      automaticChecks: {
        requiredSubstrings: [],
        forbiddenSubstrings: [],
        requiredPatterns: [],
        forbiddenPatterns: [],
      },
      provenance: "synthetic",
      sourceIds: ["engineering-line-writing-001"],
      repeatCount: 1,
      privacyReviewed: false,
    });

    expect(result.success).toBe(false);
  });
});
