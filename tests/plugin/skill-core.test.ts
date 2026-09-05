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

  it("keeps ordinary conversation free of skill metadata", () => {
    const skill = readFileSync(`${skillRoot}/SKILL.md`, "utf8");
    const boundary = readFileSync(
      `${skillRoot}/references/core-artifact-boundary.md`,
      "utf8",
    );

    expect(skill).toContain(
      "스킬 이름, 활성화 여부, 적용하지 않은 이유를 언급하지 않는다.",
    );
    expect(boundary).toContain(
      "스킬 이름, 활성화 여부, 적용하지 않은 이유를 언급하지 않는다.",
    );
  });

  it("rejects stray mixed-script suffixes in Korean output", () => {
    const naturalness = readFileSync(
      `${skillRoot}/references/core-naturalness.md`,
      "utf8",
    );

    expect(naturalness).toContain(
      "한국어 낱말 뒤에 요청하지 않은 라틴·그리스·키릴 문자 조각을 붙이지 않는다.",
    );
    expect(naturalness).toContain("설정됨reti");
  });
});
