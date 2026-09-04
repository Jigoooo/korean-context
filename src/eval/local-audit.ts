import { createHash } from "node:crypto";

import { execa } from "execa";

import { executeCodexPrompt, type CommandExecutor } from "./codex-process.js";
import {
  assertLocalSourceHashesUnchanged,
  captureLocalSourceHashes,
  loadLocalSourceManifest,
  readLocalSourceContext,
  type LocalAuditOptions,
  type LocalSourceCase,
  type LocalSourceManifest,
} from "./local-suite.js";
import {
  appendV02Run,
  effectiveV02Runs,
  loadV02Runs,
  successfulV02RunKeys,
  v02RunKey,
} from "./run-store.js";
import type { V02EvalRun } from "./v02-result-schema.js";

export type LocalAuditSummary = {
  planned: number;
  executed: number;
  skipped: number;
  failed: number;
};

export type LocalAuditDependencies = {
  execute: CommandExecutor | undefined;
  getCodexVersion: () => Promise<string>;
  readGitStatus: (repositoryRoot: string) => Promise<string>;
};
export const buildGitStatusArguments = (repositoryRoot: string) => [
  "-c",
  "safe.directory=*",
  "-C",
  repositoryRoot,
  "status",
  "--porcelain=v1",
];

const defaultDependencies: LocalAuditDependencies = {
  execute: undefined,
  getCodexVersion: async () => {
    const result = await execa("codex", ["--version"], { shell: false });
    return result.stdout.trim();
  },
  readGitStatus: async (repositoryRoot) => {
    const result = await execa("git", buildGitStatusArguments(repositoryRoot), {
      shell: false,
    });
    return result.stdout;
  },
};

type PlannedLocalAttempt = {
  item: LocalSourceCase;
  attempt: 1 | 2 | 3;
};

const planLocalAttempts = (manifest: LocalSourceManifest) =>
  manifest.cases.flatMap((item) =>
    Array.from({ length: item.repeatCount }, (_, index) => ({
      item,
      attempt: (index + 1) as 1 | 2 | 3,
    })),
  );

const localAttemptKey = (
  attempt: PlannedLocalAttempt,
  mode: LocalAuditOptions["mode"],
) =>
  v02RunKey({
    suite: "v0.2",
    caseId: attempt.item.id,
    mode,
    attempt: attempt.attempt,
  });

const hashText = (text: string) =>
  createHash("sha256").update(text).digest("hex");

const fixtureHashFor = (hashes: Record<string, string>) =>
  hashText(
    JSON.stringify(
      Object.entries(hashes).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );

const buildLocalPrompt = (
  manifest: LocalSourceManifest,
  item: LocalSourceCase,
  context: string,
) =>
  [
    item.instruction,
    "",
    `Base ref: ${manifest.baseRef}`,
    `Surface: ${item.surface}`,
    `Domain: ${item.domain}`,
    `Project vocabulary: ${JSON.stringify(item.projectVocabulary)}`,
    `Protected tokens: ${JSON.stringify(item.protectedTokens)}`,
    `Source: ${item.relativePath}:${item.startLine}-${item.endLine}`,
    "",
    context,
  ].join("\n");

const assertGitStatusUnchanged = (before: string, after: string) => {
  if (before !== after) {
    throw new Error("Local Git status changed during audit");
  }
};

export async function runLocalAudit(
  options: LocalAuditOptions,
  overrides: Partial<LocalAuditDependencies> = {},
): Promise<LocalAuditSummary> {
  const dependencies = { ...defaultDependencies, ...overrides };
  const manifest = await loadLocalSourceManifest(options.manifestPath);
  const [beforeHashes, beforeGitStatus, codexVersion] = await Promise.all([
    captureLocalSourceHashes(manifest),
    dependencies.readGitStatus(manifest.repositoryRoot),
    dependencies.getCodexVersion(),
  ]);
  const fixtureHash = fixtureHashFor(beforeHashes);
  const attempts = planLocalAttempts(manifest);
  const successful = successfulV02RunKeys(
    await loadV02Runs(options.outputPath),
  );
  const pending = attempts.filter(
    (attempt) => !successful.has(localAttemptKey(attempt, options.mode)),
  );

  for (const attempt of pending) {
    const context = await readLocalSourceContext(manifest, attempt.item);
    const prompt = buildLocalPrompt(manifest, attempt.item, context);
    const startedAt = new Date().toISOString();
    let processResult;
    try {
      processResult = await executeCodexPrompt(
        {
          prompt,
          model: options.model,
          reasoningEffort: options.reasoningEffort,
          fixtureDirectory: manifest.repositoryRoot,
          timeoutMs: 180_000,
        },
        dependencies.execute,
      );
    } finally {
      const [afterHashes, afterGitStatus] = await Promise.all([
        captureLocalSourceHashes(manifest),
        dependencies.readGitStatus(manifest.repositoryRoot),
      ]);
      assertLocalSourceHashesUnchanged(beforeHashes, afterHashes);
      assertGitStatusUnchanged(beforeGitStatus, afterGitStatus);
    }

    const run: V02EvalRun = {
      suite: "v0.2",
      caseId: attempt.item.id,
      mode: options.mode,
      attempt: attempt.attempt,
      status: processResult.status,
      startedAt,
      finishedAt: new Date().toISOString(),
      codexVersion,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      pluginVersion: options.mode === "explicit" ? "local-installed" : null,
      fixtureHash,
      promptHash: hashText(prompt),
      exitCode: processResult.exitCode,
      output: processResult.output,
      stderr: processResult.stderr,
    };
    await appendV02Run(options.outputPath, run);
  }

  const plannedKeys = new Set(
    attempts.map((attempt) => localAttemptKey(attempt, options.mode)),
  );
  const failed = effectiveV02Runs(await loadV02Runs(options.outputPath)).filter(
    (run) =>
      plannedKeys.has(v02RunKey(run)) &&
      !(
        run.status === "completed" &&
        run.exitCode === 0 &&
        run.output.trim() !== ""
      ),
  ).length;
  return {
    planned: attempts.length,
    executed: pending.length,
    skipped: attempts.length - pending.length,
    failed,
  };
}
