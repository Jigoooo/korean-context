import { rm, writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { loadSources } from "../../src/research/load-sources.js";

describe("research source registry", () => {
  it("contains diverse, reviewable evidence", async () => {
    const sources = await loadSources("research/sources.yml");

    expect(sources.length).toBeGreaterThanOrEqual(12);
    expect(new Set(sources.map((source) => source.category))).toEqual(
      new Set(["existing-skill", "engineering", "ux", "security"]),
    );
    expect(sources.every((source) => source.checkedAt === "2026-09-03")).toBe(
      true,
    );
    expect(sources.every((source) => source.finding.length >= 20)).toBe(true);
  });

  it("rejects duplicate source ids", async () => {
    const path = "research/duplicate-source-test.yml";
    await writeFile(
      path,
      [
        "- &source",
        "  id: duplicate-source",
        "  url: https://example.com/source",
        '  checkedAt: "2026-09-03"',
        "  category: engineering",
        "  originalLanguage: ko",
        "  authorType: practitioner",
        "  surface: [docs]",
        "  domain: [software]",
        "  finding: 중복 식별자를 거부하는 동작을 검증하기 위한 충분히 긴 테스트 설명이다.",
        "  decision: reuse",
        "  generalizedRule: 중복된 출처 식별자는 근거 추적을 모호하게 하므로 즉시 거부한다.",
        "  exceptions: []",
        "  evalIds: []",
        "- *source",
      ].join("\n"),
      "utf8",
    );

    try {
      await expect(loadSources(path)).rejects.toThrow(
        "Duplicate source id: duplicate-source",
      );
    } finally {
      await rm(path, { force: true });
    }
  });
});
