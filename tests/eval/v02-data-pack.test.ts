import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateAutomaticCheckDefinitions } from "../../src/eval/hard-failures.js";
import { loadV02CaseFile } from "../../src/eval/load-v02-suite.js";
import { findPrivacyViolations } from "../../src/eval/privacy.js";
import { loadSources } from "../../src/research/load-sources.js";

const casesDirectory = join("evals", "cases", "v0.2");

const loadDataPack = async () => {
  const [repair, preserve] = await Promise.all([
    loadV02CaseFile(join(casesDirectory, "repair.jsonl"), "real-world-repair"),
    loadV02CaseFile(join(casesDirectory, "preserve.jsonl"), "preserve"),
  ]);
  return { repair, preserve, all: [...repair, ...preserve] };
};

describe("v0.2 repair and preserve data pack", () => {
  it("contains the approved counts, unique ids, and eight repeated repairs", async () => {
    const { repair, preserve, all } = await loadDataPack();

    expect(repair).toHaveLength(20);
    expect(preserve).toHaveLength(10);
    expect(new Set(all.map((item) => item.id)).size).toBe(30);
    expect(repair.map((item) => item.id)).toEqual(
      Array.from(
        { length: 20 },
        (_, index) =>
          `v02-real-world-repair-${String(index + 1).padStart(3, "0")}`,
      ),
    );
    expect(preserve.map((item) => item.id)).toEqual(
      Array.from(
        { length: 10 },
        (_, index) => `v02-preserve-${String(index + 1).padStart(3, "0")}`,
      ),
    );
    expect(
      repair.filter((item) => item.repeatCount === 3).map((item) => item.id),
    ).toEqual([
      "v02-real-world-repair-001",
      "v02-real-world-repair-004",
      "v02-real-world-repair-007",
      "v02-real-world-repair-010",
      "v02-real-world-repair-013",
      "v02-real-world-repair-015",
      "v02-real-world-repair-017",
      "v02-real-world-repair-019",
    ]);
    expect(all.every((item) => item.privacyReviewed)).toBe(true);
    expect(
      repair.every((item) => item.provenance === "anonymized-derived"),
    ).toBe(true);
    expect(preserve.every((item) => item.provenance === "synthetic")).toBe(
      true,
    );
    for (const evalCase of all) {
      expect(() => validateAutomaticCheckDefinitions(evalCase)).not.toThrow();
    }
  });

  it("matches the approved repair and preserve surface matrices", async () => {
    const { repair, preserve } = await loadDataPack();

    expect(repair.map((item) => item.surface)).toEqual([
      "ui",
      "ui",
      "ui",
      "error",
      "error",
      "error",
      "comment",
      "comment",
      "comment",
      "comment",
      "comment",
      "comment",
      "commit",
      "commit",
      "commit",
      "commit",
      "pr",
      "review",
      "docs",
      "docs",
    ]);
    expect(preserve.map((item) => item.surface)).toEqual([
      "ui",
      "ui",
      "error",
      "commit",
      "commit",
      "docs",
      "docs",
      "comment",
      "pr",
      "review",
    ]);
  });

  it("defines every preserve case as one exact unchanged artifact", async () => {
    const { preserve } = await loadDataPack();

    for (const evalCase of preserve) {
      expect(evalCase.repeatCount).toBe(1);
      expect(evalCase.requiredFormat).toEqual(["exact-output"]);
      expect(evalCase.automaticChecks.requiredSubstrings).toHaveLength(1);
      expect(evalCase.input).toContain(
        evalCase.automaticChecks.requiredSubstrings[0] as string,
      );
      expect(() => validateAutomaticCheckDefinitions(evalCase)).not.toThrow();
    }
  });

  it("references only known research sources", async () => {
    const [{ all }, sources] = await Promise.all([
      loadDataPack(),
      loadSources("research/sources.yml"),
    ]);
    const known = new Set(sources.map((source) => source.id));

    expect(
      all.flatMap((item) => item.sourceIds).filter((id) => !known.has(id)),
    ).toEqual([]);
  });

  it("contains no public privacy violations in cases or fixture context", async () => {
    const fixturePath = join(
      "evals",
      "fixtures",
      "v0.2",
      "anonymized-workspace",
      "README.md",
    );
    const paths = [
      join(casesDirectory, "repair.jsonl"),
      join(casesDirectory, "preserve.jsonl"),
      fixturePath,
    ];
    const violations = (
      await Promise.all(
        paths.map(async (path) =>
          findPrivacyViolations(await readFile(path, "utf8"), path),
        ),
      )
    ).flat();

    expect(violations).toEqual([]);
  });
});
