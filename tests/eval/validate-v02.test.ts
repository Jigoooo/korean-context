import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  parseValidateV02Arguments,
  validateV02Suite,
} from "../../src/eval/validate-v02.js";
import type {
  V02EvalCase,
  V02SuiteManifest,
} from "../../src/eval/v02-schema.js";

const definitions = [
  ["repair.jsonl", "real-world-repair", "repair", 20],
  ["preserve.jsonl", "preserve", "preserve", 10],
  ["project-conflict.jsonl", "project-conflict", "conflict", 10],
  ["long-artifact.jsonl", "long-artifact", "generation", 10],
  ["format.jsonl", "format", "generation", 5],
  ["boundary.jsonl", "boundary", "boundary", 5],
] as const;

const writeSuite = async (root: string, sourceId: string) => {
  const directory = join(root, "evals", "cases", "v0.2");
  await mkdir(directory, { recursive: true });
  let repeatedRemaining = 20;

  for (const [path, scenarioType, kind, count] of definitions) {
    const lines = Array.from({ length: count }, (_, offset) => {
      const repeatCount = repeatedRemaining > 0 ? 3 : 1;
      repeatedRemaining -= repeatCount === 3 ? 1 : 0;
      return JSON.stringify({
        schemaVersion: "0.2",
        id: `v02-${scenarioType}-${String(offset + 1).padStart(3, "0")}`,
        kind,
        scenarioType,
        surface: scenarioType === "boundary" ? "conversation" : "docs",
        domain: "software",
        input: "입력",
        expectedBehavior: ["기대 동작"],
        forbiddenBehavior: [],
        protectedTokens: [],
        protectedFacts: ["의미를 보존한다"],
        expectedRegister: scenarioType === "boundary" ? "unchanged" : "한다체",
        projectVocabulary: { preferred: [], accepted: [], forbidden: [] },
        requiredFormat: [],
        automaticChecks: {
          requiredSubstrings: [],
          forbiddenSubstrings: [],
          requiredPatterns: [],
          forbiddenPatterns: [],
        },
        provenance: "synthetic",
        sourceIds: [sourceId],
        repeatCount,
        privacyReviewed: true,
      } satisfies V02EvalCase);
    });
    await writeFile(join(directory, path), `${lines.join("\n")}\n`, "utf8");
  }

  const manifest = {
    schemaVersion: "0.2",
    totalCases: 60,
    repeatedCases: 20,
    files: definitions.map(([path, scenarioType, , count]) => ({
      path,
      scenarioType,
      count,
    })),
  } satisfies V02SuiteManifest;
  const manifestPath = join(directory, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`, "utf8");
  return manifestPath;
};

describe("v0.2 suite validation", () => {
  it("resolves default and explicit CLI paths from the selected root", () => {
    const defaults = parseValidateV02Arguments([], "fixture-root");
    expect(defaults.root).toMatch(/fixture-root$/u);
    expect(defaults.manifestPath).toMatch(
      /fixture-root[\\/]evals[\\/]cases[\\/]v0\.2[\\/]manifest\.json$/u,
    );
    expect(defaults.sourcesPath).toMatch(
      /fixture-root[\\/]research[\\/]sources\.yml$/u,
    );

    const explicit = parseValidateV02Arguments(
      [
        "--root",
        "project",
        "--manifest",
        "suite.json",
        "--sources",
        "sources.yml",
      ],
      "fixture-root",
    );
    expect(explicit.root).toMatch(/fixture-root[\\/]project$/u);
    expect(explicit.manifestPath).toMatch(
      /fixture-root[\\/]project[\\/]suite\.json$/u,
    );
    expect(explicit.sourcesPath).toMatch(
      /fixture-root[\\/]project[\\/]sources\.yml$/u,
    );
  });
  it("rejects missing CLI option values", () => {
    expect(() => parseValidateV02Arguments(["--manifest"], ".")).toThrow(
      "Missing value for --manifest",
    );
  });

  it("validates suite counts, known evidence, and public privacy", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-validate-"));
    try {
      const manifestPath = await writeSuite(
        root,
        "engineering-line-writing-001",
      );

      await expect(
        validateV02Suite({
          root,
          manifestPath,
          sourcesPath: "research/sources.yml",
        }),
      ).resolves.toEqual({ cases: 60, repeated: 20 });
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("rejects an unknown evidence source with the case id", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-source-"));
    try {
      const manifestPath = await writeSuite(root, "missing-source");

      await expect(
        validateV02Suite({
          root,
          manifestPath,
          sourcesPath: "research/sources.yml",
        }),
      ).rejects.toThrow(
        "Case v02-real-world-repair-001 references unknown source missing-source",
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("rejects a manifest outside the public v0.2 case directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-root-"));
    const outside = await mkdtemp(join(tmpdir(), "korean-context-outside-"));
    try {
      const manifestPath = await writeSuite(
        outside,
        "engineering-line-writing-001",
      );

      await expect(
        validateV02Suite({
          root,
          manifestPath,
          sourcesPath: "research/sources.yml",
        }),
      ).rejects.toThrow(
        "Manifest path must be inside evals/cases/v0.2 under the public root",
      );
    } finally {
      await Promise.all([
        rm(root, { force: true, recursive: true }),
        rm(outside, { force: true, recursive: true }),
      ]);
    }
  });
  it("runs privacy validation against fixture files", async () => {
    const root = await mkdtemp(join(tmpdir(), "korean-context-fixture-"));
    try {
      const manifestPath = await writeSuite(
        root,
        "engineering-line-writing-001",
      );
      const fixtureDirectory = join(root, "evals", "fixtures", "v0.2");
      await mkdir(fixtureDirectory, { recursive: true });
      await writeFile(
        join(fixtureDirectory, "copy.md"),
        "feat/dashboard-widgets\n",
        "utf8",
      );

      await expect(
        validateV02Suite({
          root,
          manifestPath,
          sourcesPath: "research/sources.yml",
        }),
      ).rejects.toThrow("evals/fixtures/v0.2/copy.md:1 [private-branch]");
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
