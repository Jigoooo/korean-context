import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadEvalCases } from "../../src/eval/load-cases.js";
import {
  loadV02CaseFile,
  loadV02Suite,
} from "../../src/eval/load-v02-suite.js";
import { V02EvalCaseSchema } from "../../src/eval/v02-schema.js";
import type {
  V02EvalCase,
  V02ScenarioType,
  V02SuiteManifest,
} from "../../src/eval/v02-schema.js";

const fileDefinitions = [
  ["repair.jsonl", "real-world-repair", "repair", 20],
  ["preserve.jsonl", "preserve", "preserve", 10],
  ["project-conflict.jsonl", "project-conflict", "conflict", 10],
  ["long-artifact.jsonl", "long-artifact", "generation", 10],
  ["format.jsonl", "format", "generation", 5],
  ["boundary.jsonl", "boundary", "boundary", 5],
] as const;

const manifest = {
  schemaVersion: "0.2",
  totalCases: 60,
  repeatedCases: 20,
  files: fileDefinitions.map(([path, scenarioType, , count]) => ({
    path,
    scenarioType,
    count,
  })),
} satisfies V02SuiteManifest;

const caseLine = (
  scenarioType: V02ScenarioType,
  kind: V02EvalCase["kind"],
  index: number,
  repeatCount: 1 | 3,
) =>
  JSON.stringify({
    schemaVersion: "0.2",
    id: `v02-${scenarioType}-${String(index).padStart(3, "0")}`,
    kind,
    scenarioType,
    surface: scenarioType === "boundary" ? "conversation" : "docs",
    domain: "software",
    input: `입력 ${scenarioType} ${index}`,
    expectedBehavior: ["기대 동작"],
    forbiddenBehavior: [],
    protectedTokens: [],
    protectedFacts: ["입력의 기술적 의미를 보존한다"],
    expectedRegister: scenarioType === "boundary" ? "unchanged" : "한다체",
    projectVocabulary: {
      preferred: [],
      accepted: [],
      forbidden: [],
    },
    requiredFormat: [],
    automaticChecks: {
      requiredSubstrings: [],
      forbiddenSubstrings: [],
      requiredPatterns: [],
      forbiddenPatterns: [],
    },
    provenance: "synthetic",
    sourceIds: ["engineering-line-writing-001"],
    repeatCount,
    privacyReviewed: true,
  } satisfies V02EvalCase);

const withSuite = async (
  mutate: (directory: string) => Promise<void> = () => Promise.resolve(),
  run: (manifestPath: string, directory: string) => Promise<void>,
) => {
  const directory = await mkdtemp(join(tmpdir(), "korean-context-v02-"));
  try {
    let repeatedRemaining = 20;
    for (const [path, scenarioType, kind, count] of fileDefinitions) {
      const lines = Array.from({ length: count }, (_, offset) => {
        const repeatCount = repeatedRemaining > 0 ? 3 : 1;
        repeatedRemaining -= repeatCount === 3 ? 1 : 0;
        return caseLine(scenarioType, kind, offset + 1, repeatCount);
      });
      await writeFile(join(directory, path), `${lines.join("\n")}\n`, "utf8");
    }
    const manifestPath = join(directory, "manifest.json");
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    await mutate(directory);
    await run(manifestPath, directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

describe("v0.2 evaluation suite", () => {
  it("loads all cases declared by the manifest", async () => {
    await withSuite(undefined, async (manifestPath) => {
      const suite = await loadV02Suite(manifestPath);

      expect(suite.manifest.schemaVersion).toBe("0.2");
      expect(suite.cases).toHaveLength(60);
      expect(suite.cases.map((item) => item.id)).toContain(
        "v02-real-world-repair-001",
      );
      expect(suite.cases.filter((item) => item.repeatCount === 3)).toHaveLength(
        20,
      );
    });
  });

  it("loads one case file with its declared scenario", async () => {
    await withSuite(undefined, async (_manifestPath, directory) => {
      const cases = await loadV02CaseFile(
        join(directory, "preserve.jsonl"),
        "preserve",
      );

      expect(cases).toHaveLength(10);
      expect(cases.every((item) => item.scenarioType === "preserve")).toBe(
        true,
      );
    });
  });

  it("rejects a case id that does not match its scenario", () => {
    const input = JSON.parse(caseLine("format", "generation", 1, 1)) as Record<
      string,
      unknown
    >;

    expect(
      V02EvalCaseSchema.safeParse({
        ...input,
        id: "v02-preserve-001",
      }).success,
    ).toBe(false);
  });

  it.each([
    ["protected facts", { protectedFacts: [] }],
    ["evidence sources", { sourceIds: [] }],
  ])("rejects missing %s", (_name, mutation) => {
    const input = JSON.parse(
      caseLine("real-world-repair", "repair", 1, 1),
    ) as Record<string, unknown>;

    expect(V02EvalCaseSchema.safeParse({ ...input, ...mutation }).success).toBe(
      false,
    );
  });
  it("rejects a duplicate evaluation id", async () => {
    await withSuite(
      async (directory) => {
        const duplicate = caseLine("preserve", "preserve", 1, 1);
        await writeFile(
          join(directory, "preserve.jsonl"),
          `${duplicate}\n${duplicate}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "Duplicate eval id: v02-preserve-001",
        );
      },
    );
  });

  it("rejects a case stored in the wrong scenario file", async () => {
    await withSuite(
      async (directory) => {
        await writeFile(
          join(directory, "format.jsonl"),
          `${caseLine("preserve", "preserve", 99, 1)}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "Case v02-preserve-099 has scenario preserve in format.jsonl",
        );
      },
    );
  });

  it("rejects per-file count mismatches", async () => {
    await withSuite(
      async (directory) => {
        await writeFile(
          join(directory, "boundary.jsonl"),
          `${caseLine("boundary", "boundary", 1, 1)}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "boundary.jsonl declares 5 cases but contains 1",
        );
      },
    );
  });

  it("rejects undeclared JSONL files", async () => {
    await withSuite(
      async (directory) => {
        await writeFile(join(directory, "extra.jsonl"), "{}\n", "utf8");
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "Undeclared JSONL file: extra.jsonl",
        );
      },
    );
  });

  it("rejects a manifest with the wrong total", async () => {
    await withSuite(
      async (directory) => {
        await writeFile(
          join(directory, "manifest.json"),
          `${JSON.stringify({ ...manifest, totalCases: 59 })}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow();
      },
    );
  });

  it("rejects duplicate file declarations", async () => {
    await withSuite(
      async (directory) => {
        await writeFile(
          join(directory, "manifest.json"),
          `${JSON.stringify({
            ...manifest,
            files: [
              manifest.files[0],
              manifest.files[0],
              ...manifest.files.slice(2),
            ],
          })}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "Duplicate file declaration in v0.2 manifest",
        );
      },
    );
  });

  it("rejects repeated-case count mismatches", async () => {
    await withSuite(
      async (directory) => {
        const lines = Array.from({ length: 20 }, (_, offset) =>
          caseLine("real-world-repair", "repair", offset + 1, 1),
        );
        await writeFile(
          join(directory, "repair.jsonl"),
          `${lines.join("\n")}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow(
          "Manifest declares 20 repeated cases but contains 0",
        );
      },
    );
  });
  it("rejects manifest paths that escape the suite directory", async () => {
    await withSuite(
      async (directory) => {
        const escaping = {
          ...manifest,
          files: [
            { ...manifest.files[0], path: "../outside.jsonl" },
            ...manifest.files.slice(1),
          ],
        };
        await writeFile(
          join(directory, "manifest.json"),
          `${JSON.stringify(escaping)}\n`,
          "utf8",
        );
      },
      async (manifestPath) => {
        await expect(loadV02Suite(manifestPath)).rejects.toThrow();
      },
    );
  });

  it("keeps the v0.1 loader unchanged", async () => {
    await expect(loadEvalCases("evals/cases")).resolves.toHaveLength(100);
  });

  it("reports invalid JSON with its file and line", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-v02-line-"));
    try {
      await mkdir(directory, { recursive: true });
      const path = join(directory, "repair.jsonl");
      await writeFile(path, "{\n", "utf8");

      await expect(loadV02CaseFile(path, "real-world-repair")).rejects.toThrow(
        /Invalid JSON at .*repair\.jsonl:1/u,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
