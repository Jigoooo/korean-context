import { describe, expect, it } from "vitest";

import { validateAutomaticCheckDefinitions } from "../../src/eval/hard-failures.js";
import { loadEvalCases } from "../../src/eval/load-cases.js";
import { loadV02Suite } from "../../src/eval/load-v02-suite.js";
import { validateV02Suite } from "../../src/eval/validate-v02.js";
import { loadSources } from "../../src/research/load-sources.js";

const manifestPath = "evals/cases/v0.2/manifest.json";

describe("v0.2 production corpus", () => {
  it("contains 60 unique cases, 20 repeated cases, and 160 total cases", async () => {
    const [{ manifest, cases }, legacy] = await Promise.all([
      loadV02Suite(manifestPath),
      loadEvalCases("evals/cases"),
    ]);

    expect(manifest.files.map(({ path, count }) => [path, count])).toEqual([
      ["repair.jsonl", 20],
      ["preserve.jsonl", 10],
      ["project-conflict.jsonl", 10],
      ["long-artifact.jsonl", 10],
      ["format.jsonl", 5],
      ["boundary.jsonl", 5],
    ]);
    expect(cases).toHaveLength(60);
    expect(new Set(cases.map((item) => item.id)).size).toBe(60);
    expect(cases.filter((item) => item.repeatCount === 3)).toHaveLength(20);
    expect(cases.length + legacy.length).toBe(160);
  });

  it("matches the approved repeated project-conflict and long-artifact ids", async () => {
    const { cases } = await loadV02Suite(manifestPath);
    const newRepeated = cases
      .filter(
        (item) =>
          item.repeatCount === 3 &&
          ["project-conflict", "long-artifact"].includes(item.scenarioType),
      )
      .map((item) => item.id);

    expect(newRepeated).toEqual([
      "v02-project-conflict-001",
      "v02-project-conflict-002",
      "v02-project-conflict-004",
      "v02-project-conflict-006",
      "v02-project-conflict-008",
      "v02-project-conflict-010",
      "v02-long-artifact-001",
      "v02-long-artifact-003",
      "v02-long-artifact-005",
      "v02-long-artifact-007",
      "v02-long-artifact-009",
      "v02-long-artifact-010",
    ]);
  });

  it("encodes the fixture vocabulary and established artifact styles", async () => {
    const { cases } = await loadV02Suite(manifestPath);
    const conflict = cases.filter(
      (item) => item.scenarioType === "project-conflict",
    );

    expect(conflict).toHaveLength(10);
    expect(conflict[0]?.projectVocabulary.preferred).toContain("위젯");
    expect(conflict[1]?.projectVocabulary.preferred).toContain("위젯");
    expect(conflict[2]?.projectVocabulary.preferred).toContain("배치");
    expect(conflict[3]?.projectVocabulary.preferred).toContain("칸");
    expect(conflict[4]?.projectVocabulary.preferred).toContain("칸");
    expect(conflict[5]?.projectVocabulary.preferred).toContain("서랍");
    expect(conflict[6]?.projectVocabulary.preferred).toContain("서랍");
    expect(conflict[7]).toMatchObject({
      surface: "comment",
      expectedRegister: "한다체",
    });
    expect(conflict[8]).toMatchObject({
      surface: "commit",
      expectedRegister: "phrase",
    });
    expect(conflict[9]?.expectedBehavior.join(" ")).toContain("사용자");
  });

  it("covers the approved long-artifact, format, and boundary matrices", async () => {
    const { cases } = await loadV02Suite(manifestPath);
    const long = cases.filter((item) => item.scenarioType === "long-artifact");
    const format = cases.filter((item) => item.scenarioType === "format");
    const boundary = cases.filter((item) => item.scenarioType === "boundary");

    expect(long.map((item) => item.surface)).toEqual([
      "ui",
      "ui",
      "error",
      "error",
      "docs",
      "docs",
      "docs",
      "pr",
      "comment",
      "release",
    ]);
    expect(long.every((item) => item.protectedTokens.length >= 2)).toBe(true);
    expect(format.map((item) => item.requiredFormat)).toEqual([
      ["commit-subject"],
      ["bullet-list"],
      ["markdown-table"],
      ["exact-output"],
      ["single-line"],
    ]);
    expect(
      boundary.every(
        (item) =>
          item.surface === "conversation" &&
          item.kind === "boundary" &&
          item.repeatCount === 1,
      ),
    ).toBe(true);

    const connectionRefused = boundary.find(
      (item) => item.id === "v02-boundary-004",
    );
    expect(connectionRefused?.automaticChecks.forbiddenPatterns).toContain(
      "[가-힣](?:[A-Za-z]|[\\u0370-\\u03FF]|[\\u0400-\\u04FF])",
    );
  });

  it("passes source, automatic-definition, and public privacy validation", async () => {
    const [{ cases }, sources, summary] = await Promise.all([
      loadV02Suite(manifestPath),
      loadSources("research/sources.yml"),
      validateV02Suite({
        root: process.cwd(),
        manifestPath,
        sourcesPath: "research/sources.yml",
      }),
    ]);
    const known = new Set(sources.map((source) => source.id));

    expect(summary).toEqual({ cases: 60, repeated: 20 });
    expect(
      cases.flatMap((item) => item.sourceIds).filter((id) => !known.has(id)),
    ).toEqual([]);
    for (const evalCase of cases) {
      expect(() => validateAutomaticCheckDefinitions(evalCase)).not.toThrow();
    }
  });
});

it("protects canvas labels in developer status and technical tables", async () => {
  const { cases } = await loadV02Suite(manifestPath);
  const status = cases.find((item) => item.id === "v02-long-artifact-002");
  const table = cases.find((item) => item.id === "v02-long-artifact-007");

  expect(status?.protectedTokens).toEqual(["WebGL", "canvas", "60 FPS"]);
  expect(table?.protectedTokens).toEqual(["WebGL", "canvas", "Shift", "Esc"]);
});
