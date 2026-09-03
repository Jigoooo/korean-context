import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadEvalCases } from "../../src/eval/load-cases.js";
import type { EvalCase } from "../../src/eval/schema.js";
import { evalKinds, type EvalKind } from "../../src/eval/types.js";
import { loadSources } from "../../src/research/load-sources.js";

const countBy = <T>(items: T[], select: (item: T) => string) => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = select(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
};

const caseLine = (kind: EvalKind, id: string) =>
  JSON.stringify({
    id,
    kind,
    surface: "docs",
    domain: "software",
    input: "입력",
    expectedBehavior: ["기대 동작"],
    forbiddenBehavior: [],
    protectedTokens: [],
    expectedRegister: "한다체",
    sourceIds: ["existing-humanize-001"],
    live: false,
  } satisfies EvalCase);

const withCaseFiles = async (
  overrides: Partial<Record<EvalKind, string>>,
  run: (directory: string) => Promise<void>,
) => {
  const directory = await mkdtemp(join(tmpdir(), "korean-context-eval-"));
  try {
    for (const kind of evalKinds) {
      await writeFile(
        join(directory, `${kind}.jsonl`),
        overrides[kind] ?? caseLine(kind, `${kind}-001`),
        "utf8",
      );
    }
    await run(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

describe("v0.1 evaluation corpus", () => {
  it("has the exact category distribution", async () => {
    const cases = await loadEvalCases("evals/cases");

    expect(cases).toHaveLength(100);
    expect(countBy(cases, (item) => item.kind)).toEqual({
      repair: 45,
      generation: 15,
      preserve: 10,
      conflict: 10,
      transfer: 10,
      boundary: 10,
    });
  });

  it("has the exact surface and domain distributions", async () => {
    const cases = await loadEvalCases("evals/cases");

    expect(countBy(cases, (item) => item.surface)).toEqual({
      commit: 10,
      pr: 10,
      issue: 8,
      review: 10,
      comment: 10,
      docs: 12,
      ui: 10,
      error: 8,
      test: 6,
      release: 6,
      conversation: 10,
    });
    expect(countBy(cases, (item) => item.domain)).toEqual({
      software: 32,
      frontend: 12,
      backend: 12,
      infra: 10,
      "security-common": 10,
      "security-appsec": 8,
      "security-vulnerability": 8,
      "security-pentest-redteam": 8,
    });
  });

  it("selects the exact 30-case live set", async () => {
    const live = (await loadEvalCases("evals/cases")).filter(
      (item) => item.live,
    );

    expect(live).toHaveLength(30);
    expect(countBy(live, (item) => item.kind)).toEqual({
      repair: 10,
      generation: 5,
      preserve: 5,
      conflict: 3,
      transfer: 3,
      boundary: 4,
    });
  });

  it("links every case to known evidence and protects unique ids", async () => {
    const cases = await loadEvalCases("evals/cases");
    const sources = await loadSources("research/sources.yml");
    const sourceIds = new Set(sources.map((source) => source.id));

    expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
    expect(
      cases.every((item) => item.sourceIds.every((id) => sourceIds.has(id))),
    ).toBe(true);
    expect(
      cases
        .filter((item) => item.kind === "boundary")
        .every((item) => item.surface === "conversation"),
    ).toBe(true);
  });

  it("keeps source evaluation links bidirectional", async () => {
    const cases = await loadEvalCases("evals/cases");
    const sources = await loadSources("research/sources.yml");
    const casesById = new Map(cases.map((item) => [item.id, item]));

    for (const source of sources) {
      expect(source.evalIds.length, source.id).toBeGreaterThan(0);
      for (const evalId of source.evalIds) {
        expect(casesById.has(evalId), `${source.id} -> ${evalId}`).toBe(true);
        expect(
          casesById.get(evalId)?.sourceIds,
          `${evalId} -> ${source.id}`,
        ).toContain(source.id);
      }
    }
  });

  it("reports invalid JSON with its file and line", async () => {
    await withCaseFiles({ repair: "{" }, async (directory) => {
      await expect(loadEvalCases(directory)).rejects.toThrow(
        /Invalid JSON at .*repair\.jsonl:1/u,
      );
    });
  });

  it("rejects a case stored in the wrong kind file", async () => {
    await withCaseFiles(
      { generation: caseLine("repair", "repair-101") },
      async (directory) => {
        await expect(loadEvalCases(directory)).rejects.toThrow(
          "Case repair-101 has kind repair in generation.jsonl",
        );
      },
    );
  });

  it("rejects duplicate evaluation ids", async () => {
    const duplicate = caseLine("repair", "repair-101");
    await withCaseFiles(
      { repair: `${duplicate}\n${duplicate}` },
      async (directory) => {
        await expect(loadEvalCases(directory)).rejects.toThrow(
          "Duplicate eval id: repair-101",
        );
      },
    );
  });
});
