import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertRunManifestCompatibility,
  backupRunArtifacts,
  hashFixtureTree,
  parseRunV02Arguments,
  runV02Evaluation,
  selectPendingAttempts,
  type PlannedRunIdentity,
} from "../../src/eval/run-v02.js";
import { loadV02Runs, successfulV02RunKeys } from "../../src/eval/run-store.js";
import type {
  PlannedLegacyAttempt,
  PlannedV02Attempt,
  V02RunExecutionContext,
} from "../../src/eval/v02-codex-runner.js";
import type {
  V02EvalRun,
  V02RunManifest,
} from "../../src/eval/v02-result-schema.js";

const hash = "a".repeat(64);

const manifest = (overrides: Partial<V02RunManifest> = {}): V02RunManifest => ({
  suite: "v0.2",
  mode: "explicit",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: "0.2.0-rc.1",
  fixtureHash: hash,
  memoryIsolation: "disabled",
  createdAt: "2026-09-04T00:00:00.000Z",
  ...overrides,
});

const run = (overrides: Partial<V02EvalRun> = {}): V02EvalRun => ({
  suite: "v0.2",
  caseId: "v02-format-001",
  mode: "explicit",
  attempt: 1,
  status: "completed",
  startedAt: "2026-09-04T00:00:00.000Z",
  finishedAt: "2026-09-04T00:00:01.000Z",
  codexVersion: "codex-cli 0.147.0",
  model: "gpt-5.6-sol",
  reasoningEffort: "xhigh",
  pluginVersion: "0.2.0-rc.1",
  fixtureHash: hash,
  memoryIsolation: "disabled",
  promptHash: hash,
  exitCode: 0,
  output: "결과",
  stderr: "",
  ...overrides,
});

describe("v0.2 run orchestration", () => {
  it("parses controlled defaults and resolves paths from the current directory", () => {
    const options = parseRunV02Arguments(
      ["--mode", "baseline"],
      "fixture-root",
    );

    expect(options).toMatchObject({
      suite: "v0.2",
      mode: "baseline",
      model: "gpt-5.6-sol",
      reasoningEffort: "xhigh",
      pluginVersion: null,
      concurrency: 2,
      reset: false,
    });
    expect(options.manifestPath).toMatch(
      /fixture-root[\\/]evals[\\/]cases[\\/]v0\.2[\\/]manifest\.json$/u,
    );
    expect(options.fixtureDirectory).toMatch(
      /fixture-root[\\/]evals[\\/]fixtures[\\/]v0\.2[\\/]anonymized-workspace$/u,
    );
    expect(options.outputPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]baseline[\\/]runs\.jsonl$/u,
    );
  });

  it.each([
    [[], "Missing required --mode"],
    [["--mode", "explicit"], "Explicit mode requires --plugin-version"],
    [
      ["--mode", "baseline", "--plugin-version", "0.2.0-rc.1"],
      "Baseline mode forbids --plugin-version",
    ],
    [
      ["--suite", "v0.1-regression", "--mode", "baseline"],
      "v0.1-regression supports explicit mode only",
    ],
    [
      ["--mode", "baseline", "--concurrency", "5"],
      "Concurrency must be an integer from 1 to 4",
    ],
  ] as const)("rejects invalid arguments %#", (args, message) => {
    expect(() => parseRunV02Arguments([...args], ".")).toThrow(message);
  });

  it("accepts the v0.1 regression defaults", () => {
    const options = parseRunV02Arguments(
      [
        "--suite",
        "v0.1-regression",
        "--mode",
        "explicit",
        "--plugin-version",
        "0.2.0-rc.1",
      ],
      "fixture-root",
    );

    expect(options.manifestPath).toMatch(/fixture-root[\\/]evals[\\/]cases$/u);
    expect(options.fixtureDirectory).toMatch(
      /fixture-root[\\/]evals[\\/]fixtures[\\/]workspace$/u,
    );
    expect(options.outputPath).toMatch(
      /fixture-root[\\/]evals[\\/]results[\\/]v0\.2[\\/]v0\.1-regression[\\/]runs\.jsonl$/u,
    );
  });

  it("accepts identical manifests and rejects mixed execution settings", () => {
    expect(() =>
      assertRunManifestCompatibility(manifest(), {
        ...manifest(),
        createdAt: "2026-09-04T01:00:00.000Z",
      }),
    ).not.toThrow();
    expect(() =>
      assertRunManifestCompatibility(manifest(), manifest({ model: "other" })),
    ).toThrow("Run manifest mismatch: model");
    expect(() =>
      assertRunManifestCompatibility(
        manifest(),
        manifest({ memoryIsolation: "inherit" as "disabled" }),
      ),
    ).toThrow("Run manifest mismatch: memoryIsolation");
  });

  it("moves reset artifacts to timestamped backups instead of deleting them", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-reset-"));
    try {
      const outputPath = join(directory, "runs.jsonl");
      const manifestPath = join(directory, "run-manifest.json");
      await Promise.all([
        writeFile(outputPath, "raw runs\n", "utf8"),
        writeFile(manifestPath, "manifest\n", "utf8"),
      ]);

      const backups = await backupRunArtifacts(
        [outputPath, manifestPath],
        new Date("2026-09-04T02:03:04.000Z"),
      );

      await expect(access(outputPath)).rejects.toThrow();
      await expect(access(manifestPath)).rejects.toThrow();
      expect(backups).toEqual([
        `${outputPath}.bak-20260904T020304000Z`,
        `${manifestPath}.bak-20260904T020304000Z`,
      ]);
      await expect(readFile(backups[0] as string, "utf8")).resolves.toBe(
        "raw runs\n",
      );
      await expect(readFile(backups[1] as string, "utf8")).resolves.toBe(
        "manifest\n",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("hashes a normalized fixture tree independently of creation order", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-hash-"));
    try {
      const first = join(directory, "first");
      const second = join(directory, "second");
      await Promise.all([
        mkdir(join(first, "nested"), { recursive: true }),
        mkdir(join(second, "nested"), { recursive: true }),
      ]);
      await writeFile(join(first, "nested", "b.txt"), "둘", "utf8");
      await writeFile(join(first, "a.txt"), "하나", "utf8");
      await writeFile(join(second, "a.txt"), "하나", "utf8");
      await writeFile(join(second, "nested", "b.txt"), "둘", "utf8");

      const firstHash = await hashFixtureTree(first);
      const secondHash = await hashFixtureTree(second);
      expect(firstHash).toMatch(/^[a-f0-9]{64}$/u);
      expect(secondHash).toBe(firstHash);

      await writeFile(join(second, "nested", "b.txt"), "변경", "utf8");
      await expect(hashFixtureTree(second)).resolves.not.toBe(firstHash);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
  it("skips only attempts whose effective record succeeded", () => {
    const attempts: PlannedRunIdentity[] = [
      { suite: "v0.2", caseId: "v02-format-001", mode: "explicit", attempt: 1 },
      { suite: "v0.2", caseId: "v02-format-001", mode: "explicit", attempt: 2 },
    ];
    const existing = [
      run({ attempt: 1 }),
      run({ attempt: 2, status: "failed", exitCode: 1, output: "" }),
    ];

    expect(
      selectPendingAttempts(attempts, successfulV02RunKeys(existing)),
    ).toEqual([attempts[1]]);
  });
  it("appends completed runs and skips them on a compatible resume", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-run-"));
    try {
      const fixtureDirectory = join(directory, "fixture");
      await mkdir(fixtureDirectory);
      await writeFile(join(fixtureDirectory, "README.md"), "fixture", "utf8");
      const options = parseRunV02Arguments(
        [
          "--mode",
          "baseline",
          "--manifest",
          "suite.json",
          "--fixture",
          fixtureDirectory,
          "--output",
          join(directory, "results", "runs.jsonl"),
        ],
        directory,
      );
      expect(options.manifestPath).toBe(join(directory, "suite.json"));
      const evalCase = {
        schemaVersion: "0.2" as const,
        id: "v02-format-001",
        kind: "generation" as const,
        scenarioType: "format" as const,
        surface: "ui" as const,
        domain: "frontend" as const,
        input: "입력",
        expectedBehavior: ["형식을 지킨다"],
        forbiddenBehavior: [],
        protectedTokens: [],
        protectedFacts: ["의미를 보존한다"],
        expectedRegister: "합니다체" as const,
        projectVocabulary: { preferred: [], accepted: [], forbidden: [] },
        requiredFormat: ["single-line" as const],
        automaticChecks: {
          requiredSubstrings: [],
          forbiddenSubstrings: [],
          requiredPatterns: [],
          forbiddenPatterns: [],
        },
        provenance: "synthetic" as const,
        sourceIds: ["engineering-line-writing-001"],
        repeatCount: 1 as const,
        privacyReviewed: true as const,
      };
      let calls = 0;
      const dependencies = {
        getCodexVersion: () => Promise.resolve("codex-cli 0.147.0"),
        loadV02: () =>
          Promise.resolve({
            manifest: {
              schemaVersion: "0.2" as const,
              totalCases: 60 as const,
              repeatedCases: 20 as const,
              files: [],
            },
            cases: [evalCase],
          }),
        runV02: (attempt: PlannedV02Attempt) => {
          calls += 1;
          return Promise.resolve(
            run({
              suite: "v0.2",
              caseId: attempt.evalCase.id,
              mode: "baseline",
              attempt: attempt.attempt,
              pluginVersion: null,
            }),
          );
        },
      };

      await expect(runV02Evaluation(options, dependencies)).resolves.toEqual({
        planned: 1,
        executed: 1,
        skipped: 0,
        failed: 0,
      });
      await expect(
        readFile(join(directory, "results", "run-manifest.json"), "utf8"),
      ).resolves.toContain('"memoryIsolation": "disabled"');
      await expect(runV02Evaluation(options, dependencies)).resolves.toEqual({
        planned: 1,
        executed: 0,
        skipped: 1,
        failed: 0,
      });
      await expect(
        runV02Evaluation({ ...options, model: "other" }, dependencies),
      ).rejects.toThrow("Run manifest mismatch: model");
      expect(calls).toBe(1);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
  it("loads all 100 v0.1 cases as single explicit regression attempts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-legacy-"));
    try {
      const fixtureDirectory = join(directory, "fixture");
      await mkdir(fixtureDirectory);
      await writeFile(join(fixtureDirectory, "README.md"), "fixture", "utf8");
      const options = parseRunV02Arguments(
        [
          "--suite",
          "v0.1-regression",
          "--mode",
          "explicit",
          "--plugin-version",
          "0.2.0-rc.1",
          "--fixture",
          fixtureDirectory,
          "--output",
          join(directory, "results", "runs.jsonl"),
        ],
        process.cwd(),
      );
      const runLegacy = (
        attempt: PlannedLegacyAttempt,
        context: V02RunExecutionContext,
      ) =>
        Promise.resolve(
          run({
            suite: "v0.1-regression",
            caseId: attempt.evalCase.id,
            mode: "explicit",
            attempt: 1,
            codexVersion: context.metadata.codexVersion,
            model: context.metadata.model,
            reasoningEffort: context.metadata.reasoningEffort,
            pluginVersion: context.metadata.pluginVersion,
            fixtureHash: context.metadata.fixtureHash,
          }),
        );

      await expect(
        runV02Evaluation(options, {
          getCodexVersion: () => Promise.resolve("codex-cli 0.147.0"),
          runLegacy,
        }),
      ).resolves.toEqual({
        planned: 100,
        executed: 100,
        skipped: 0,
        failed: 0,
      });
      await expect(loadV02Runs(options.outputPath)).resolves.toHaveLength(100);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
