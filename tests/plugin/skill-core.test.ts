import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const skillRoot = "plugins/korean-context/skills/korean-context";

describe("Korean Context skill core", () => {
  it("declares positive and negative activation boundaries", () => {
    const skill = readFileSync(`${skillRoot}/SKILL.md`, "utf8");

    expect(skill).toContain("name: korean-context");
    expect(skill).toContain("persistent or publishable Korean artifacts");
    expect(skill).toContain("Do not use for ordinary assistant conversation");
    expect(skill.length).toBeLessThanOrEqual(3_500);
  });

  it("routes to every core reference without nesting", () => {
    const skill = readFileSync(`${skillRoot}/SKILL.md`, "utf8");
    const references = [
      "core-artifact-boundary.md",
      "core-naturalness.md",
      "core-translationese.md",
      "core-terminology.md",
      "core-register.md",
    ];

    for (const name of references) {
      expect(skill).toContain(`references/${name}`);
      expect(existsSync(`${skillRoot}/references/${name}`)).toBe(true);
    }
    expect(skill).not.toContain("references/references/");
  });
});
