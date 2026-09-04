import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appendV02Run,
  effectiveV02Runs,
  loadV02Runs,
  successfulV02RunKeys,
  v02RunKey,
} from "../../src/eval/run-store.js";
import {
  V02EvalRunSchema,
  V02RunManifestSchema,
  type V02EvalRun,
} from "../../src/eval/v02-result-schema.js";

const hash = "a".repeat(64);

const runFixture = (overrides: Partial<V02EvalRun> = {}): V02EvalRun => ({
  suite: "v0.2",
  caseId: "v02-format-001",
  mode: "baseline",
  attempt: 1,
  status: "completed",
  startedAt: "2026-09-04T00:00:00.000Z",
  finishedAt: "2026-09-04T00:00:01.000Z",
  codexVersion: "codex-cli 0.149.1",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: null,
  fixtureHash: hash,
  memoryIsolation: "disabled",
  promptHash: hash,
  exitCode: 0,
  output: "결과",
  stderr: "",
  ...overrides,
});

const withResultPath = async (run: (path: string) => Promise<void>) => {
  const directory = await mkdtemp(join(tmpdir(), "korean-context-runs-"));
  try {
    await run(join(directory, "nested", "runs.jsonl"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

describe("v0.2 result storage", () => {
  it("accepts versioned run manifests and attempts", () => {
    expect(
      V02RunManifestSchema.parse({
        suite: "v0.2",
        mode: "baseline",
        codexVersion: "codex-cli 0.149.1",
        model: "gpt-5.6-sol",
        reasoningEffort: "xhigh",
        pluginVersion: null,
        fixtureHash: hash,
        memoryIsolation: "disabled",
        createdAt: "2026-09-04T00:00:00.000Z",
      }),
    ).toMatchObject({ suite: "v0.2", mode: "baseline" });
    expect(V02EvalRunSchema.parse(runFixture())).toEqual(runFixture());
  });

  it.each([
    ["attempt zero", runFixture({ attempt: 0 })],
    ["attempt four", runFixture({ attempt: 4 })],
    ["short fixture hash", runFixture({ fixtureHash: "abc" })],
    ["short prompt hash", runFixture({ promptHash: "abc" })],
  ])("rejects %s", (_name, input) => {
    expect(V02EvalRunSchema.safeParse(input).success).toBe(false);
  });

  it("preserves a failed record when a retry with the same key succeeds", async () => {
    await withResultPath(async (path) => {
      const failed = runFixture({
        status: "failed",
        exitCode: 1,
        output: "",
        stderr: "process failed",
      });
      const successfulRetry = runFixture({
        startedAt: "2026-09-04T00:00:02.000Z",
        finishedAt: "2026-09-04T00:00:03.000Z",
        output: "재시도 결과",
      });

      await appendV02Run(path, failed);
      await appendV02Run(path, successfulRetry);

      const raw = await loadV02Runs(path);
      expect(raw).toEqual([failed, successfulRetry]);
      expect(effectiveV02Runs(raw)).toEqual([successfulRetry]);
      expect([...successfulV02RunKeys(raw)]).toEqual([
        v02RunKey(successfulRetry),
      ]);
    });
  });

  it("distinguishes suite, mode, and attempt in the resume key", () => {
    const baseline = runFixture();
    const keys = new Set([
      v02RunKey(baseline),
      v02RunKey(runFixture({ suite: "v0.1-regression" })),
      v02RunKey(runFixture({ mode: "explicit" })),
      v02RunKey(runFixture({ attempt: 2 })),
    ]);

    expect(keys.size).toBe(4);
  });

  it("uses the last record per key while preserving first-seen key order", () => {
    const first = runFixture({ caseId: "v02-format-001", output: "첫 결과" });
    const second = runFixture({
      caseId: "v02-format-002",
      output: "둘째 결과",
    });
    const retry = runFixture({ caseId: "v02-format-001", output: "재시도" });

    expect(effectiveV02Runs([first, second, retry])).toEqual([retry, second]);
  });

  it("never resumes from failed, timed out, interrupted, non-zero, or empty runs", () => {
    const runs = [
      runFixture({ caseId: "failed", status: "failed", exitCode: 1 }),
      runFixture({ caseId: "timeout", status: "timeout", exitCode: 1 }),
      runFixture({ caseId: "interrupted", status: "interrupted", exitCode: 1 }),
      runFixture({ caseId: "non-zero", exitCode: 1 }),
      runFixture({ caseId: "empty", output: "  " }),
      runFixture({ caseId: "successful" }),
    ];

    expect([...successfulV02RunKeys(runs)]).toEqual([
      v02RunKey(runs.at(-1) as V02EvalRun),
    ]);
  });

  it("returns an empty list when the result file does not exist", async () => {
    await withResultPath(async (path) => {
      await expect(loadV02Runs(path)).resolves.toEqual([]);
    });
  });

  it("reports invalid JSON with its path and line", async () => {
    await withResultPath(async (path) => {
      await appendV02Run(path, runFixture());
      await writeFile(path, `${JSON.stringify(runFixture())}\n\n{\n`, "utf8");

      await expect(loadV02Runs(path)).rejects.toThrow(
        new RegExp(`Invalid JSON at .*runs\\.jsonl:3`, "u"),
      );
    });
  });

  it("reports invalid run schemas with their path and line", async () => {
    await withResultPath(async (path) => {
      const invalidRun = { ...runFixture(), attempt: 0 };
      await appendV02Run(path, runFixture());
      await writeFile(
        path,
        `${JSON.stringify(runFixture())}\n\n${JSON.stringify(invalidRun)}\n`,
        "utf8",
      );

      await expect(loadV02Runs(path)).rejects.toThrow(
        new RegExp(`Invalid run at .*runs\\.jsonl:3`, "u"),
      );
    });
  });
  it("serializes concurrent appends without losing or corrupting records", async () => {
    await withResultPath(async (path) => {
      const runs = Array.from({ length: 50 }, (_, index) =>
        runFixture({ caseId: `concurrent-${String(index).padStart(2, "0")}` }),
      );

      await Promise.all(runs.map((run) => appendV02Run(path, run)));

      const stored = await loadV02Runs(path);
      expect(stored).toHaveLength(50);
      expect(new Set(stored.map((run) => run.caseId))).toEqual(
        new Set(runs.map((run) => run.caseId)),
      );
    });
  });
});
