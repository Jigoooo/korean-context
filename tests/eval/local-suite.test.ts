import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import type { CommandExecutor } from "../../src/eval/codex-process.js";
import {
  buildGitStatusArguments,
  runLocalAudit,
} from "../../src/eval/local-audit.js";

import {
  assertLocalSourceHashesUnchanged,
  captureLocalSourceHashes,
  loadLocalSourceManifest,
  parseLocalAuditArguments,
  readLocalSourceContext,
  type LocalSourceCase,
  type LocalSourceManifest,
} from "../../src/eval/local-suite.js";
import { loadV02Runs } from "../../src/eval/run-store.js";

const sourceCase = (
  overrides: Partial<LocalSourceCase> = {},
): LocalSourceCase => ({
  id: "local-001",
  relativePath: "src/copy.ts",
  startLine: 2,
  endLine: 3,
  surface: "ui",
  domain: "frontend",
  instruction: "문구를 검토해줘.",
  projectVocabulary: {
    preferred: ["위젯"],
    accepted: [],
    forbidden: ["컴포넌트"],
  },
  protectedTokens: ["WIDGET_LABEL"],
  repeatCount: 1,
  ...overrides,
});

const withLocalRepository = async (
  run: (input: {
    root: string;
    manifestPath: string;
    manifest: LocalSourceManifest;
  }) => Promise<void>,
) => {
  const directory = await mkdtemp(join(tmpdir(), "korean-context-local-"));
  try {
    const root = join(directory, "repository");
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "copy.ts"),
      "첫째 줄\n둘째 줄\n셋째 줄\n넷째 줄\n",
      "utf8",
    );
    const manifest = {
      repositoryRoot: root,
      baseRef: "main",
      cases: [sourceCase()],
    } satisfies LocalSourceManifest;
    const manifestPath = join(directory, "source-manifest.json");
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`, "utf8");
    await run({ root, manifestPath, manifest });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
};

describe("read-only local source suite", () => {
  it("uses process-local safe.directory for WSL-compatible Git status", () => {
    expect(
      buildGitStatusArguments(String.raw`\\wsl.localhost\Ubuntu\repo`),
    ).toEqual([
      "-c",
      "safe.directory=*",
      "-C",
      String.raw`\\wsl.localhost\Ubuntu\repo`,
      "status",
      "--porcelain=v1",
    ]);
  });
  it("loads a manifest and reads only its declared line range", async () => {
    await withLocalRepository(async ({ manifestPath }) => {
      const manifest = await loadLocalSourceManifest(manifestPath);

      await expect(
        readLocalSourceContext(manifest, manifest.cases[0] as LocalSourceCase),
      ).resolves.toBe("둘째 줄\n셋째 줄");
    });
  });

  it.each([
    "../secret.txt",
    String.raw`C:\Users\alice\secret.txt`,
    String.raw`\\wsl.localhost\Ubuntu\home\alice\secret.txt`,
    "/home/alice/secret.txt",
  ])(
    "rejects source paths outside the repository: %s",
    async (relativePath) => {
      await withLocalRepository(async ({ manifest }) => {
        await expect(
          readLocalSourceContext(manifest, sourceCase({ relativePath })),
        ).rejects.toThrow("Local source path escapes repository root");
      });
    },
  );

  it("rejects missing, binary, and out-of-range source contexts", async () => {
    await withLocalRepository(async ({ root, manifest }) => {
      await writeFile(join(root, "src", "binary.dat"), Buffer.from([0, 1, 2]));

      await expect(
        readLocalSourceContext(
          manifest,
          sourceCase({ relativePath: "src/missing.ts" }),
        ),
      ).rejects.toThrow("Local source file does not exist");
      await expect(
        readLocalSourceContext(
          manifest,
          sourceCase({
            relativePath: "src/binary.dat",
            startLine: 1,
            endLine: 1,
          }),
        ),
      ).rejects.toThrow("Local source file must be UTF-8 text");
      await expect(
        readLocalSourceContext(
          manifest,
          sourceCase({ startLine: 4, endLine: 5 }),
        ),
      ).rejects.toThrow("Local source line range exceeds file");
    });
  });

  it("detects any source mutation across a stubbed local run", async () => {
    await withLocalRepository(async ({ root, manifest }) => {
      const before = await captureLocalSourceHashes(manifest);
      await Promise.resolve("stubbed local run");
      const unchanged = await captureLocalSourceHashes(manifest);
      expect(() =>
        assertLocalSourceHashesUnchanged(before, unchanged),
      ).not.toThrow();

      await writeFile(join(root, "src", "copy.ts"), "변경됨\n", "utf8");
      const changed = await captureLocalSourceHashes(manifest);
      expect(() => assertLocalSourceHashesUnchanged(before, changed)).toThrow(
        "Local source changed during audit: src/copy.ts",
      );
    });
  });

  it("keeps local audit output under .local", () => {
    const options = parseLocalAuditArguments(
      ["--mode", "baseline"],
      "fixture-root",
    );
    expect(options.outputPath).toMatch(
      /fixture-root[\\/]\.local[\\/]evals[\\/]v0\.2[\\/]baseline[\\/]runs\.jsonl$/u,
    );
    expect(() =>
      parseLocalAuditArguments(
        ["--mode", "baseline", "--output", "evals/results/local.jsonl"],
        "fixture-root",
      ),
    ).toThrow("Local audit output must stay inside .local");
  });

  it("rejects invalid manifest ranges and duplicate case ids", async () => {
    await withLocalRepository(async ({ manifestPath, manifest }) => {
      await writeFile(
        manifestPath,
        `${JSON.stringify({
          ...manifest,
          cases: [sourceCase({ startLine: 3, endLine: 2 })],
        })}\n`,
        "utf8",
      );
      await expect(loadLocalSourceManifest(manifestPath)).rejects.toThrow();

      await writeFile(
        manifestPath,
        `${JSON.stringify({
          ...manifest,
          cases: [sourceCase(), sourceCase()],
        })}\n`,
        "utf8",
      );
      await expect(loadLocalSourceManifest(manifestPath)).rejects.toThrow(
        "Duplicate local case id: local-001",
      );
    });
  });
  it("appends local results and resumes only completed attempts", async () => {
    await withLocalRepository(async ({ manifestPath }) => {
      const options = parseLocalAuditArguments(
        ["--mode", "baseline", "--manifest", manifestPath],
        dirname(manifestPath),
      );
      let calls = 0;
      const execute: CommandExecutor = () => {
        calls += 1;
        return Promise.resolve({
          exitCode: 0,
          stdout:
            '{"type":"item.completed","item":{"type":"agent_message","text":"검토 결과"}}',
          stderr: "",
        });
      };
      const dependencies = {
        execute,
        getCodexVersion: () => Promise.resolve("codex-cli 0.147.0"),
        readGitStatus: () => Promise.resolve(" M existing-file.ts\n"),
      };

      await expect(runLocalAudit(options, dependencies)).resolves.toEqual({
        planned: 1,
        executed: 1,
        skipped: 0,
        failed: 0,
      });
      await expect(runLocalAudit(options, dependencies)).resolves.toEqual({
        planned: 1,
        executed: 0,
        skipped: 1,
        failed: 0,
      });
      expect(calls).toBe(1);
      await expect(loadV02Runs(options.outputPath)).resolves.toMatchObject([
        {
          suite: "v0.2",
          caseId: "local-001",
          mode: "baseline",
          attempt: 1,
          status: "completed",
          output: "검토 결과",
        },
      ]);
    });
  });

  it("fails when a local run changes a declared source or Git status", async () => {
    await withLocalRepository(async ({ root, manifestPath }) => {
      const options = parseLocalAuditArguments(
        ["--mode", "baseline", "--manifest", manifestPath],
        dirname(manifestPath),
      );
      const mutatingExecute: CommandExecutor = async () => {
        await writeFile(join(root, "src", "copy.ts"), "변경됨\n", "utf8");
        return { exitCode: 0, stdout: "", stderr: "" };
      };
      await expect(
        runLocalAudit(options, {
          execute: mutatingExecute,
          getCodexVersion: () => Promise.resolve("codex-cli 0.147.0"),
          readGitStatus: () => Promise.resolve(""),
        }),
      ).rejects.toThrow("Local source changed during audit: src/copy.ts");
    });

    await withLocalRepository(async ({ manifestPath }) => {
      const options = parseLocalAuditArguments(
        ["--mode", "baseline", "--manifest", manifestPath],
        dirname(manifestPath),
      );
      let statusReads = 0;
      await expect(
        runLocalAudit(options, {
          execute: () =>
            Promise.resolve({ exitCode: 0, stdout: "", stderr: "" }),
          getCodexVersion: () => Promise.resolve("codex-cli 0.147.0"),
          readGitStatus: () => {
            statusReads += 1;
            return Promise.resolve(statusReads === 1 ? "" : " M src/copy.ts\n");
          },
        }),
      ).rejects.toThrow("Local Git status changed during audit");
    });
  });
});
