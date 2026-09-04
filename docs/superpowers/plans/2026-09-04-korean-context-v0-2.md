# Korean Context v0.2 Real-World Quality Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a reproducible v0.2 evaluation that validates Korean Context against 60 anonymized real-world cases, preserves the existing v0.1 evidence, and blocks release on meaning, project-vocabulary, privacy, format, or stability failures.

**Architecture:** Keep the existing v0.1 schema and results immutable. Add a manifest-driven v0.2 suite, append-only run storage keyed by suite/case/mode/attempt, deterministic hard-failure checks, manual scoring, and a release-gate aggregator. Public anonymized fixtures are authoritative; local Offen inspection remains read-only and stores raw context only under ignored `.local/` paths.

**Tech Stack:** TypeScript 6, Node.js 22.13+, pnpm 11.22.0, Zod 4, Vitest 4, execa, Codex CLI.

**Spec:** `docs/superpowers/specs/2026-09-04-korean-context-v0-2-design.md`

## Global Constraints

- Existing v0.1 case files, schemas, raw outputs, scores, and summaries remain unchanged.
- The public v0.2 suite contains exactly 60 cases; v0.1 plus v0.2 contains 160 cases.
- Public fixtures contain no Offen source code, absolute user paths, branch names, commit SHAs, credentials, customer data, or internal identifiers.
- Project terminology and existing artifact style override Korean Context defaults.
- v0.2 compares Codex baseline and explicit Korean Context modes; implicit activation is not a v0.2 release metric.
- The 20 cases declared with `repeatCount: 3` must complete three fresh attempts in both modes.
- Raw v0.2 runs are append-only. Derived summaries may be regenerated; raw records may not be compacted or overwritten.
- Release-gate hard failures are: technical meaning change, invented fact or condition, project-vocabulary violation, protected-content violation, boundary violation, privacy violation, missing attempt, mixed execution configuration, empty output, timeout, and interrupted execution.
- Release thresholds are: hard failures `0`, unnecessary rewrite at most `5%`, format adherence at least `95%`, and gold awkwardness correction at least `90%`.
- Default execution adds no judge model, runtime network service, background process, or rewrite pass beyond the requested Codex generation.
- Update `ROADMAP.md` after each completed task with evidence and the next unchecked task.

## Planned File Map

- `src/eval/v02-schema.ts`: v0.2 case and manifest schemas.
- `src/eval/load-v02-suite.ts`: manifest-driven suite loader and distribution checks.
- `src/eval/privacy.ts`: public-case, fixture, and result privacy validation.
- `src/eval/validate-v02.ts`: v0.2 suite, source-link, and privacy validation orchestration.
- `src/eval/validate-v02-cli.ts`: deterministic v0.2 suite validation entry point.
- `src/eval/v02-result-schema.ts`: versioned run manifest and attempt schemas.
- `src/eval/run-store.ts`: append-only read, write, resume, and effective-record helpers.
- `src/eval/codex-process.ts`: shared shell-free Codex process invocation and event parsing.
- `src/eval/v02-codex-runner.ts`: v0.2 prompt, attempt planning, and run creation.
- `src/eval/run-v02.ts`: fixture hashing, run manifests, resume, reset, and orchestration.
- `src/eval/run-v02-cli.ts`: resumable baseline/explicit execution CLI.
- `src/eval/hard-failures.ts`: deterministic output checks and violation types.
- `src/eval/v02-score.ts`: v0.2 manual score schema and release-gate aggregation.
- `src/eval/score-v02-cli.ts`: score/run validation and summary output.
- `src/eval/local-suite.ts`: read-only local source manifest loader.
- `src/eval/local-audit-cli.ts`: ignored local candidate/context export.
- `tests/eval/*.test.ts`: focused tests for each module.
- `evals/cases/v0.2/*`: manifest and 60 public cases.
- `evals/fixtures/v0.2/anonymized-workspace/*`: synthetic public workspace context.
- `evals/results/v0.2/*`: committed release evidence after live evaluation.
- `.gitignore`: ignore `.local/`.
- `package.json`: v0.2 validate, run, score, and local-audit commands.
- `ROADMAP.md`: task progress and next-step handoff.

---

### Task 1: Add the versioned v0.2 suite schema and manifest loader

**Files:**

- Create: `src/eval/v02-schema.ts`
- Create: `src/eval/load-v02-suite.ts`
- Create: `tests/eval/v02-suite.test.ts`

**Interfaces:**

- Produces: `V02EvalCaseSchema`, `V02SuiteManifestSchema`, `V02EvalCase`, `V02SuiteManifest`.
- Produces: `loadV02CaseFile(path: string, scenarioType: V02ScenarioType): Promise<V02EvalCase[]>` and `loadV02Suite(manifestPath: string): Promise<{ manifest: V02SuiteManifest; cases: V02EvalCase[] }>`.
- Preserves: `EvalCaseSchema` and `loadEvalCases()` behavior for v0.1.

- [x] **Step 1: Write failing schema and manifest tests**

Create `tests/eval/v02-suite.test.ts` with temporary manifest helpers and these assertions:

```ts
it("loads a manifest-declared v0.2 suite", async () => {
  const suite = await withV02Suite(validManifest, validCaseLines, loadV02Suite);
  expect(suite.manifest.schemaVersion).toBe("0.2");
  expect(suite.cases).toHaveLength(60);
  expect(suite.cases.map((item) => item.id)).toContain(
    "v02-real-world-repair-001",
  );
});

it.each([
  ["wrong total", { totalCases: 2 }],
  ["duplicate id", { duplicateCase: true }],
  ["wrong scenario file", { wrongScenario: true }],
  ["undeclared jsonl", { extraFile: true }],
])("rejects %s", async (_name, mutation) => {
  await expect(loadMutatedSuite(mutation)).rejects.toThrow();
});

it("keeps the v0.1 loader unchanged", async () => {
  await expect(loadEvalCases("evals/cases")).resolves.toHaveLength(100);
});
```

- [x] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```powershell
pnpm vitest run tests/eval/v02-suite.test.ts
```

Expected: FAIL because `v02-schema.ts` and `load-v02-suite.ts` do not exist.

- [x] **Step 3: Implement strict v0.2 schemas**

Create `src/eval/v02-schema.ts` with these public shapes:

```ts
export const v02ScenarioTypes = [
  "real-world-repair",
  "preserve",
  "project-conflict",
  "long-artifact",
  "format",
  "boundary",
] as const;

export const v02RequiredFormats = [
  "single-line",
  "bullet-list",
  "markdown-table",
  "commit-subject",
  "exact-output",
] as const;

export type V02ScenarioType = (typeof v02ScenarioTypes)[number];
export type V02RequiredFormat = (typeof v02RequiredFormats)[number];

export const AutomaticChecksSchema = z.object({
  requiredSubstrings: z.array(z.string().min(1)),
  forbiddenSubstrings: z.array(z.string().min(1)),
  requiredPatterns: z.array(z.string().min(1)),
  forbiddenPatterns: z.array(z.string().min(1)),
});

export const V02EvalCaseSchema = z.object({
  schemaVersion: z.literal("0.2"),
  id: z.string().regex(
    /^v02-(real-world-repair|preserve|project-conflict|long-artifact|format|boundary)-\d{3}$/u,
  ),
  kind: z.enum(evalKinds),
  scenarioType: z.enum(v02ScenarioTypes),
  surface: z.enum(surfaces),
  domain: z.enum(domains),
  input: z.string().min(1),
  expectedBehavior: z.array(z.string().min(1)).min(1),
  forbiddenBehavior: z.array(z.string().min(1)),
  protectedTokens: z.array(z.string().min(1)),
  protectedFacts: z.array(z.string().min(1)).min(1),
  expectedRegister: z.enum(registers),
  projectVocabulary: z.object({
    preferred: z.array(z.string().min(1)),
    accepted: z.array(z.string().min(1)),
    forbidden: z.array(z.string().min(1)),
  }),
  requiredFormat: z.array(z.enum(v02RequiredFormats)),
  automaticChecks: AutomaticChecksSchema,
  provenance: z.enum(["anonymized-derived", "synthetic"]),
  sourceIds: z.array(z.string().min(1)).min(1),
  repeatCount: z.union([z.literal(1), z.literal(3)]),
  privacyReviewed: z.literal(true),
})
  .strict()
  .superRefine((value, context) => {
    if (!value.id.startsWith(`v02-${value.scenarioType}-`)) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: `Case id ${value.id} does not match scenario ${value.scenarioType}`,
      });
    }
  });

export const V02SuiteManifestSchema = z.object({
  schemaVersion: z.literal("0.2"),
  totalCases: z.literal(60),
  repeatedCases: z.literal(20),
  files: z.array(z.object({
    path: z.string().regex(/^[a-z0-9-]+\.jsonl$/u),
    scenarioType: z.enum(v02ScenarioTypes),
    count: z.number().int().positive(),
  })).length(6),
}).strict();

```

Export inferred TypeScript types from both schemas. Keep `automaticChecks` deterministic; `protectedFacts` remains the human-readable meaning contract.

- [x] **Step 4: Implement manifest-driven loading**

Create `src/eval/load-v02-suite.ts`. Implement `loadV02CaseFile()` as the single JSONL parser and call it from `loadV02Suite()`. Resolve every declared file relative to the manifest directory, reject paths that escape that directory, parse line-by-line with `file:line` errors, and then assert:

```ts
export async function loadV02Suite(
  manifestPath: string,
): Promise<{ manifest: V02SuiteManifest; cases: V02EvalCase[] }>;
```

The implementation must reject duplicate IDs, wrong `scenarioType` for a declared file, mismatched per-file counts, a total other than 60, a repeated-case count other than 20, and undeclared `.jsonl` files.

- [x] **Step 5: Exercise the loader with a complete temporary manifest**

Keep the manifest and all six JSONL files inside the temporary test directory. Use the exact distribution `20/10/10/10/5/5` and 20 repeated cases, then assert `loadV02Suite()` returns 60 cases. Do not add a production manifest until Task 8 can add all six complete data files atomically.
- [x] **Step 6: Run schema and v0.1 regression tests**

Run:

```powershell
pnpm vitest run tests/eval/v02-suite.test.ts tests/eval/corpus.test.ts
```

Expected: PASS with both the new suite tests and all existing v0.1 corpus tests green.

- [x] **Step 7: Update the roadmap and commit**

Mark only the v0.2 schema and loader foundation complete. Set the next task to Task 2.

```powershell
git add src/eval/v02-schema.ts src/eval/load-v02-suite.ts tests/eval/v02-suite.test.ts ROADMAP.md
git commit -m "feat(eval): v0.2 평가 스키마 추가"
```

---

### Task 2: Add public-evaluation privacy and suite validation

**Files:**

- Create: `src/eval/privacy.ts`
- Create: `src/eval/validate-v02.ts`
- Create: `src/eval/validate-v02-cli.ts`
- Create: `tests/eval/privacy.test.ts`
- Create: `tests/eval/validate-v02.test.ts`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: `loadV02Suite()` from Task 1.
- Produces: `findPrivacyViolations(text: string, source: string): PrivacyViolation[]`.
- Produces: `validatePublicV02Artifacts(root: string): Promise<void>`.
- Produces: `validateV02Suite(options: ValidateV02Options): Promise<V02ValidationSummary>` and `parseValidateV02Arguments()`.
- Produces command: `pnpm eval:v0.2:validate`.

- [x] **Step 1: Write privacy tests before implementation**

Create `tests/eval/privacy.test.ts`:

```ts
it.each([
  ["Windows user path", String.raw`C:\Users\alice\project`],
  ["WSL share", String.raw`\\wsl.localhost\Ubuntu\home\alice\repo`],
  ["POSIX home", "/home/alice/private-repo"],
  ["private repository slug", "offen-asm-mvp"],
  ["private branch", "feat/dashboard-widgets"],
])("detects %s", (_name, text) => {
  expect(findPrivacyViolations(text, "fixture.txt")).not.toEqual([]);
});

it("allows portable synthetic paths and project vocabulary", () => {
  expect(
    findPrivacyViolations(
      "<workspace>/packages/client에서 위젯과 서랍 문구를 확인한다.",
      "fixture.txt",
    ),
  ).toEqual([]);
});
```

Add tests that reject `privacyReviewed: false`, scan all manifest-declared JSONL and fixture files, and report `path:line` without echoing surrounding private content. Create `tests/eval/validate-v02.test.ts` to validate a complete temporary 60-case suite, reject unknown source IDs, run privacy checks, resolve CLI paths, and reject missing option values.

- [x] **Step 2: Run the test and confirm the missing-module failure**

```powershell
pnpm vitest run tests/eval/privacy.test.ts
```

Expected: FAIL because `privacy.ts` does not exist.

- [x] **Step 3: Implement privacy validation**

Create `src/eval/privacy.ts` with a narrow rule set:

```ts
export type PrivacyViolation = {
  source: string;
  line: number;
  rule:
    | "windows-user-path"
    | "wsl-user-path"
    | "posix-user-path"
    | "private-repository"
    | "private-branch";
};

export function findPrivacyViolations(
  text: string,
  source: string,
): PrivacyViolation[];

export async function validatePublicV02Artifacts(root: string): Promise<void>;
```

Scan only `evals/cases/v0.2`, `evals/fixtures/v0.2`, and committed `evals/results/v0.2`. Do not scan the design documents, which intentionally describe the source of the methodology. Never include the matched private text in an error message.

- [x] **Step 4: Add the validation CLI and scripts**

`src/eval/validate-v02.ts` loads the manifest, validates source IDs against `research/sources.yml`, and runs the privacy scan. It rejects a manifest outside `<root>/evals/cases/v0.2` before reading suite data. `src/eval/validate-v02-cli.ts` only parses paths, invokes that function, and prints:

```text
Validated v0.2 suite: 60 cases, 20 repeated, privacy checks passed
```

Add these scripts to `package.json`:

```json
{
  "eval:v0.2:validate": "tsx src/eval/validate-v02-cli.ts"
}
```

Tasks 4, 6, and 9 add their scripts only when the corresponding CLI file exists.

Add `.local/` to `.gitignore`. Do not weaken the existing `.env` rules.

- [x] **Step 5: Run focused and full deterministic checks**

```powershell
pnpm vitest run tests/eval/privacy.test.ts tests/eval/validate-v02.test.ts tests/eval/v02-suite.test.ts
pnpm typecheck
git diff --check
```

Expected: all tests pass; typecheck exits 0; no whitespace errors.

- [x] **Step 6: Update the roadmap and commit**

```powershell
git add src/eval/privacy.ts src/eval/validate-v02.ts src/eval/validate-v02-cli.ts tests/eval/privacy.test.ts tests/eval/validate-v02.test.ts .gitignore package.json ROADMAP.md
git commit -m "feat(eval): 공개 평가 개인정보 검사 추가"
```

---

### Task 3: Add append-only v0.2 result storage

**Files:**

- Create: `src/eval/v02-result-schema.ts`
- Create: `src/eval/run-store.ts`
- Create: `tests/eval/run-store.test.ts`
- Modify: `ROADMAP.md`

**Interfaces:**

- Produces: `V02RunManifestSchema`, `V02EvalRunSchema`, `V02RunManifest`, `V02EvalRun`.
- Produces: `v02RunKey()`, `loadV02Runs()`, `effectiveV02Runs()`, `successfulV02RunKeys()`, `appendV02Run()`.

- [x] **Step 1: Write append-only and resume tests**

Create `tests/eval/run-store.test.ts` with a temporary result file:

```ts
it("preserves failed records when a retry succeeds", async () => {
  await appendV02Run(path, failedRun);
  await appendV02Run(path, successfulRetryWithSameKey);

  const raw = await loadV02Runs(path);
  expect(raw).toHaveLength(2);
  expect(effectiveV02Runs(raw)).toEqual([successfulRetryWithSameKey]);
});

it("distinguishes attempts in the resume key", () => {
  expect(v02RunKey({ suite: "v0.2", caseId: "v02-format-001", mode: "explicit", attempt: 1 }))
    .not.toBe(v02RunKey({ suite: "v0.2", caseId: "v02-format-001", mode: "explicit", attempt: 2 }));
});

it("never treats timeout, interruption, or empty output as successful", () => {
  expect([...successfulV02RunKeys([timeoutRun, interruptedRun, emptyRun])]).toEqual([]);
});
```

- [x] **Step 2: Run the focused test and confirm failure**

```powershell
pnpm vitest run tests/eval/run-store.test.ts
```

Expected: FAIL because the v0.2 result modules do not exist.

- [x] **Step 3: Implement versioned run records**

Create `src/eval/v02-result-schema.ts` around these fields:

```ts
export const v02Modes = ["baseline", "explicit"] as const;
export const evaluationSuites = ["v0.2", "v0.1-regression"] as const;
export const v02RunStatuses = [
  "completed",
  "failed",
  "timeout",
  "interrupted",
] as const;

export type V02Mode = (typeof v02Modes)[number];
export type EvaluationSuite = (typeof evaluationSuites)[number];
export type V02RunStatus = (typeof v02RunStatuses)[number];

export const V02RunManifestSchema = z.object({
  suite: z.enum(evaluationSuites),
  mode: z.enum(v02Modes),
  codexVersion: z.string().min(1),
  model: z.string().min(1),
  reasoningEffort: z.string().min(1),
  pluginVersion: z.string().min(1).nullable(),
  fixtureHash: z.string().regex(/^[a-f0-9]{64}$/u),
  createdAt: z.iso.datetime(),
}).strict();

export const V02EvalRunSchema = z.object({
  suite: z.enum(evaluationSuites),
  caseId: z.string().min(1),
  mode: z.enum(v02Modes),
  attempt: z.number().int().min(1).max(3),
  status: z.enum(v02RunStatuses),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  codexVersion: z.string().min(1),
  model: z.string().min(1),
  reasoningEffort: z.string().min(1),
  pluginVersion: z.string().min(1).nullable(),
  fixtureHash: z.string().regex(/^[a-f0-9]{64}$/u),
  promptHash: z.string().regex(/^[a-f0-9]{64}$/u),
  exitCode: z.number().int(),
  output: z.string(),
  stderr: z.string(),
}).strict();
```

- [x] **Step 4: Implement append-only storage**

Create `src/eval/run-store.ts`:

```ts
export function v02RunKey(
  run: Pick<V02EvalRun, "suite" | "caseId" | "mode" | "attempt">,
): string;

export async function loadV02Runs(path: string): Promise<V02EvalRun[]>;
export function effectiveV02Runs(runs: V02EvalRun[]): V02EvalRun[];
export function successfulV02RunKeys(runs: V02EvalRun[]): Set<string>;
export async function appendV02Run(path: string, run: V02EvalRun): Promise<void>;
```

`effectiveV02Runs()` returns the last appended record per composite key while `loadV02Runs()` always returns every raw record. `appendV02Run()` creates the parent directory and appends one complete JSON line; it does not rewrite the file. Appends to the same resolved path are serialized, and JSON or schema errors report the original file line even when blank lines are present.

- [x] **Step 5: Run focused tests and v0.1 runner regressions**

```powershell
pnpm vitest run tests/eval/run-store.test.ts tests/eval/codex-runner.test.ts
pnpm typecheck
```

Expected: PASS; existing v0.1 latest-attempt behavior remains unchanged in its own module.

- [x] **Step 6: Update the roadmap and commit**

```powershell
git add src/eval/v02-result-schema.ts src/eval/run-store.ts tests/eval/run-store.test.ts ROADMAP.md
git commit -m "feat(eval): v0.2 실행 결과 보존"
```


---

### Task 4: Add the resumable v0.2 Codex runner

**Files:**

- Create: `src/eval/codex-process.ts`
- Create: `src/eval/v02-codex-runner.ts`
- Create: `src/eval/run-v02.ts`
- Create: `src/eval/run-v02-cli.ts`
- Create: `tests/eval/v02-codex-runner.test.ts`
- Create: `tests/eval/run-v02.test.ts`
- Modify: `src/eval/codex-runner.ts`
- Modify: `tests/eval/codex-runner.test.ts`
- Modify: `package.json`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: `V02EvalCase`, `V02EvalRun`, `appendV02Run()`, and `successfulV02RunKeys()`.
- Produces: `executeCodexPrompt()`, `buildV02Prompt()`, `planV02Attempts()`, `runCodexV02Attempt()`.
- Produces: `hashFixtureTree()`, `parseRunV02Arguments()`, `runV02Evaluation()`, reset backup, and compatible resume helpers.
- Produces command: `pnpm eval:v0.2:run -- --mode baseline|explicit ...`.

**Implementation note (2026-09-04):** Verified `codex exec` arguments against the current official CLI and configuration references and local `codex-cli 0.147.0`. The shared process request keeps `reasoningEffort` optional so the v0.1 runner continues to omit the effort override, while every v0.2 and v0.1-regression run passes the controlled effort explicitly. `V02RunExecutionContext` carries both the run manifest and fixture directory.

- [x] **Step 1: Write runner tests before implementation**

Add tests to `tests/eval/codex-runner.test.ts` proving the refactor still passes prompts on stdin, uses `shell: false`, selects the last `agent_message`, and leaves `buildPrompt()` unchanged.

Create `tests/eval/v02-codex-runner.test.ts`:

```ts
it("plans one or three attempts from case metadata", () => {
  expect(planV02Attempts(caseWith({ repeatCount: 1 }), "baseline")).toHaveLength(1);
  expect(planV02Attempts(caseWith({ repeatCount: 3 }), "explicit")).toEqual([
    expect.objectContaining({ attempt: 1 }),
    expect.objectContaining({ attempt: 2 }),
    expect.objectContaining({ attempt: 3 }),
  ]);
});

it("adds the skill invocation only in explicit mode", () => {
  expect(buildV02Prompt(testCase, "explicit")).toContain("$korean-context");
  expect(buildV02Prompt(testCase, "baseline")).toBe(testCase.input);
});

it("records timeout without discarding stderr", async () => {
  const run = await runCodexV02Attempt(attempt, { metadata, fixtureDirectory }, timeoutExecutor);
  expect(run).toMatchObject({ status: "timeout", output: "" });
  expect(run.stderr).not.toBe("");
});
```

- [x] **Step 2: Run the tests and confirm the new test fails**

```powershell
pnpm vitest run tests/eval/codex-runner.test.ts tests/eval/v02-codex-runner.test.ts
```

Expected: existing tests pass; the v0.2 test fails because its modules are missing.

- [x] **Step 3: Extract the shared Codex process boundary**

Create `src/eval/codex-process.ts`:

```ts
export type CodexProcessRequest = {
  prompt: string;
  model: string;
  reasoningEffort?: string;
  fixtureDirectory: string;
  timeoutMs: number;
};

export type CodexProcessResult = {
  status: "completed" | "failed" | "timeout" | "interrupted";
  exitCode: number;
  output: string;
  stderr: string;
};

export type CommandExecutor = (
  file: string,
  args: string[],
options: { input: string; shell: false; timeout: number },
) => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  isCanceled?: boolean;
  isTerminated?: boolean;
}>;

export async function executeCodexPrompt(
  request: CodexProcessRequest,
  execute?: CommandExecutor,
): Promise<CodexProcessResult>;
```

Invoke `codex exec --ephemeral --json --model <model> --sandbox read-only --cd <fixture> -` without a shell. Pass reasoning effort through `-c model_reasoning_effort=<value>`. Convert execa timeout and interruption errors into explicit statuses while retaining stderr. Refactor `runCodexCase()` to use this function without changing its public result shape.

- [x] **Step 4: Implement attempt planning and hashing**

Create `src/eval/v02-codex-runner.ts`:

```ts
export type PlannedV02Attempt = {
  evalCase: V02EvalCase;
  mode: V02Mode;
  attempt: 1 | 2 | 3;
};

export function planV02Attempts(
  evalCase: V02EvalCase,
  mode: V02Mode,
): PlannedV02Attempt[];

export function buildV02Prompt(
  evalCase: Pick<V02EvalCase, "input">,
  mode: V02Mode,
): string;

export type V02RunExecutionContext = {
  metadata: V02RunManifest;
  fixtureDirectory: string;
  timeoutMs?: number;
};

export async function runCodexV02Attempt(
  attempt: PlannedV02Attempt,
  context: V02RunExecutionContext,
  execute?: CommandExecutor,
): Promise<V02EvalRun>;
```

`run-v02.ts` computes SHA-256 over the normalized fixture tree for `fixtureHash`; the runner hashes the exact stdin prompt for `promptHash`. Baseline uses `pluginVersion: null`; explicit requires the exact plugin version.

- [x] **Step 5: Implement the resumable CLI**

Create `src/eval/run-v02.ts` for testable orchestration, keep `src/eval/run-v02-cli.ts` as a thin entry point, and add `"eval:v0.2:run": "tsx src/eval/run-v02-cli.ts"` to `package.json`. Support these required options:

```text
--mode baseline|explicit
--model <model>
--reasoning-effort <effort>
--plugin-version <version>
--manifest <path>
--fixture <path>
--output <path>
--concurrency <1..4>
--reset
```

Require `--plugin-version` only for explicit mode. The `v0.2` suite loads the manifest and honors `repeatCount`; `v0.1-regression` loads the existing 100 cases, permits explicit mode only, and plans one attempt per case. Refuse mixed model, effort, fixture hash, Codex version, or plugin version before any model call. Skip successful composite keys and append every new result. `--reset` renames existing data to `*.bak-<UTC timestamp>` instead of deleting it.

- [x] **Step 6: Run runner, type, and regression tests**

```powershell
pnpm vitest run tests/eval/v02-codex-runner.test.ts tests/eval/run-v02.test.ts tests/eval/run-store.test.ts tests/eval/codex-runner.test.ts
pnpm typecheck
pnpm test
```

Expected: all tests pass; unit tests make no real Codex calls.

- [x] **Step 7: Update the roadmap and commit**

```powershell
git add src/eval/codex-process.ts src/eval/v02-codex-runner.ts src/eval/run-v02.ts src/eval/run-v02-cli.ts src/eval/codex-runner.ts tests/eval/v02-codex-runner.test.ts tests/eval/run-v02.test.ts tests/eval/codex-runner.test.ts package.json ROADMAP.md
git commit -m "feat(eval): 반복 가능한 Codex 실행기 추가"
```
---

### Task 5: Add deterministic hard-failure checks

**Files:**

- Create: `src/eval/hard-failures.ts`
- Create: `tests/eval/hard-failures.test.ts`
- Modify: `src/eval/validate-v02.ts`
- Modify: `tests/eval/validate-v02.test.ts`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: `V02EvalCase` and an effective `V02EvalRun`.
- Produces: `evaluateAutomaticChecks(evalCase, run): AutomaticEvaluation`.
- Produces: `validateAutomaticCheckDefinitions(evalCase)` for guarded pattern compilation and `exact-output` configuration validation.

- [x] **Step 1: Write one failing test per deterministic rule**

Create `tests/eval/hard-failures.test.ts` with independent cases for protected tokens, required and forbidden substrings, valid and invalid regular expressions, forbidden project vocabulary, empty output, non-completed status, and each supported format.

```ts
it("reports every violation without stopping at the first", () => {
  const result = evaluateAutomaticChecks(
    caseWith({
      protectedTokens: ["AbortController"],
      projectVocabulary: {
        preferred: ["서랍"],
        accepted: [],
        forbidden: ["드로어"],
      },
      automaticChecks: {
        requiredSubstrings: ["취소"],
        forbiddenSubstrings: ["다시 시도해 주세요"],
        requiredPatterns: [],
        forbiddenPatterns: [],
      },
    }),
    completedRunWith("드로어를 표시합니다. 다시 시도해 주세요."),
  );

  expect(result.violations.map((item) => item.rule)).toEqual([
    "protected-token",
    "required-substring",
    "forbidden-substring",
    "project-vocabulary",
  ]);
});
```

- [x] **Step 2: Run the focused test and confirm failure**

```powershell
pnpm vitest run tests/eval/hard-failures.test.ts
```

Expected: FAIL because `hard-failures.ts` does not exist.
- [x] **Step 3: Implement explicit violation records**

Create `src/eval/hard-failures.ts`:

```ts
export type AutomaticViolationRule =
  | "run-status"
  | "empty-output"
  | "protected-token"
  | "required-substring"
  | "forbidden-substring"
  | "required-pattern"
  | "forbidden-pattern"
  | "project-vocabulary"
  | "required-format";

export type AutomaticViolation = {
  rule: AutomaticViolationRule;
  detail: string;
};

export type AutomaticEvaluation = {
  caseId: string;
  mode: V02Mode;
  attempt: number;
  passed: boolean;
  violations: AutomaticViolation[];
};

export function evaluateAutomaticChecks(
  evalCase: V02EvalCase,
  run: V02EvalRun,
): AutomaticEvaluation;
```

Compile declared patterns in a guarded helper and reject invalid patterns during suite validation. Implement deterministic checks for `single-line`, `bullet-list`, `markdown-table`, `commit-subject`, and `exact-output`. Because the schema has no separate expected-output field, `exact-output` requires exactly one `requiredSubstrings` value and compares the complete output against it. Do not guess naturalness or technical meaning with regular expressions.

- [x] **Step 4: Run focused and schema tests**

```powershell
pnpm vitest run tests/eval/hard-failures.test.ts tests/eval/v02-suite.test.ts
pnpm typecheck
```

Expected: PASS with every violation type independently covered.

- [x] **Step 5: Update the roadmap and commit**

```powershell
git add src/eval/hard-failures.ts src/eval/validate-v02.ts tests/eval/hard-failures.test.ts tests/eval/validate-v02.test.ts docs/superpowers/plans/2026-09-04-korean-context-v0-2.md ROADMAP.md
git commit -m "feat(eval): v0.2 자동 실패 판정 추가"
```
---

### Task 6: Add manual score validation and the v0.2 release gate

**Files:**

- Create: `src/eval/v02-score.ts`
- Create: `src/eval/score-v02-cli.ts`
- Create: `tests/eval/v02-score.test.ts`
- Modify: `evals/rubric.md`
- Modify: `package.json`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: loaded suite, effective runs, automatic evaluations, manual scores, and v0.1 regression runs.
- Produces: `V02EvalScoreSchema`, `summarizeV02Scores()`, `evaluateV02ReleaseGate()`.
- Produces command: `pnpm eval:v0.2:score`.

- [ ] **Step 1: Write gate tests for every threshold**

Create `tests/eval/v02-score.test.ts` with a complete passing fixture, then mutate one condition per test:

```ts
it.each([
  ["technical meaning", { technicalMeaningChange: true }],
  ["invented fact", { inventedFact: true }],
  ["project vocabulary", { projectVocabularyViolation: true }],
  ["protected content", { protectedContentViolation: true }],
  ["boundary", { boundaryViolation: true }],
])("blocks release on %s failure", (_name, mutation) => {
  const result = evaluateV02ReleaseGate(completeGateInputWith(mutation));
  expect(result.passed).toBe(false);
});

it("requires all attempts and one execution configuration", () => {
  expect(evaluateV02ReleaseGate(inputMissingAttempt).reasons).toContain(
    "missing-attempt",
  );
  expect(evaluateV02ReleaseGate(inputWithMixedModel).reasons).toContain(
    "mixed-configuration",
  );
});

it("enforces percentage thresholds", () => {
  expect(evaluateV02ReleaseGate(inputWithSixPercentRewrite).passed).toBe(false);
  expect(evaluateV02ReleaseGate(inputWithNinetyFourPercentFormat).passed).toBe(false);
  expect(evaluateV02ReleaseGate(inputWithEightyNinePercentCorrection).passed).toBe(false);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

```powershell
pnpm vitest run tests/eval/v02-score.test.ts
```

Expected: FAIL because `v02-score.ts` does not exist.

- [ ] **Step 3: Implement the versioned score schema**

Create `src/eval/v02-score.ts`:

```ts
const points = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const V02EvalScoreSchema = z
  .object({
    suite: z.literal("v0.2"),
    caseId: z.string().min(1),
    mode: z.enum(v02Modes),
    attempt: z.number().int().min(1).max(3),
    naturalness: points,
    terminology: points,
    meaningPreservation: points,
    surfaceFit: points,
    translationese: points,
    technicalMeaningChange: z.boolean(),
    inventedFact: z.boolean(),
    projectVocabularyViolation: z.boolean(),
    protectedContentViolation: z.boolean(),
    formatViolation: z.boolean(),
    boundaryViolation: z.boolean(),
    unnecessaryRewrite: z.boolean(),
    improvedOverBaseline: z.boolean(),
    goldIssuesTotal: z.number().int().nonnegative(),
    goldIssuesCorrected: z.number().int().nonnegative(),
    notes: z.string().min(1),
  })
  .strict()
  .refine(
    (score) => score.goldIssuesCorrected <= score.goldIssuesTotal,
    "goldIssuesCorrected cannot exceed goldIssuesTotal",
  );
```

Export `V02EvalScore` and define `V02ReleaseGateInput` from imported schema types instead of duplicating their shapes.
- [ ] **Step 4: Implement release-gate aggregation**

```ts
export type V02ReleaseGateInput = {
  cases: V02EvalCase[];
  baselineRuns: V02EvalRun[];
  explicitRuns: V02EvalRun[];
  v01RegressionRuns: V02EvalRun[];
  automaticEvaluations: AutomaticEvaluation[];
  scores: V02EvalScore[];
};

export type V02GateResult = {
  passed: boolean;
  reasons: string[];
  average: number;
  hardFailures: number;
  unnecessaryRewriteRate: number;
  formatAdherenceRate: number;
  goldCorrectionRate: number;
  repeatedHardFailureVariance: number;
};

export function summarizeV02Scores(scores: V02EvalScore[]): V02GateResult;
export function evaluateV02ReleaseGate(
  input: V02ReleaseGateInput,
): V02GateResult;
```

Require complete attempts for every v0.2 case, one execution configuration per mode, 100 successful v0.1 explicit regression runs, automatic evaluations for every v0.2 run, and a manual score for every run selected by the scoring protocol. Baseline language violations remain comparison evidence; baseline infrastructure, privacy, completeness, and empty-output failures still block the run. Count explicit hard failures toward release and treat a repeated explicit case as unstable if any attempt has a hard failure even when another attempt passes.

- [ ] **Step 5: Update the rubric and score CLI**

Add v0.2 boolean definitions, gold-issue rules, blind-mode review, and second-review rules to `evals/rubric.md`. Add `"eval:v0.2:score": "tsx src/eval/score-v02-cli.ts"` to `package.json`. `src/eval/score-v02-cli.ts` accepts these explicit paths:

```text
--manifest evals/cases/v0.2/manifest.json
--baseline-runs evals/results/v0.2/baseline/runs.jsonl
--explicit-runs evals/results/v0.2/explicit/runs.jsonl
--scores evals/results/v0.2/scores/scores.jsonl
--v01-regression-runs evals/results/v0.2/v0.1-regression/runs.jsonl
--output evals/results/v0.2/gate.json
```

Print the JSON gate result and exit 1 when `passed` is false.

- [ ] **Step 6: Run score, legacy, and type tests**

```powershell
pnpm vitest run tests/eval/v02-score.test.ts tests/eval/score.test.ts
pnpm typecheck
```

Expected: PASS; the v0.1 score schema and summary remain unchanged.

- [ ] **Step 7: Update the roadmap and commit**

```powershell
git add src/eval/v02-score.ts src/eval/score-v02-cli.ts tests/eval/v02-score.test.ts evals/rubric.md package.json ROADMAP.md
git commit -m "feat(eval): v0.2 릴리스 게이트 추가"
```

---

### Task 7: Author the 20 repair and 10 preserve cases

**Files:**

- Create: `evals/cases/v0.2/repair.jsonl`
- Create: `evals/cases/v0.2/preserve.jsonl`
- Create: `evals/fixtures/v0.2/anonymized-workspace/README.md`
- Create: `tests/eval/v02-data-pack.test.ts`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: v0.2 schema, loader, privacy validator, and existing research source IDs.
- Produces: 30 of the 60 public cases and 8 of the 20 repeated cases.

- [ ] **Step 1: Write failing partial-pack tests**

Create `tests/eval/v02-data-pack.test.ts` and load `repair.jsonl` and `preserve.jsonl` with `loadV02CaseFile()`. Assert counts 20 and 10, eight repeated repair cases, unique IDs, `privacyReviewed: true`, and valid research source links.

```ts
expect(repair).toHaveLength(20);
expect(preserve).toHaveLength(10);
expect(repair.filter((item) => item.repeatCount === 3)).toHaveLength(8);
```

- [ ] **Step 2: Run the partial-pack test and confirm missing-file failure**

```powershell
pnpm vitest run tests/eval/v02-data-pack.test.ts
```

Expected: FAIL because the two data files do not exist.
- [ ] **Step 3: Write the exact repair matrix**

Create 20 `real-world-repair` cases:

| IDs | Count | Surface and content |
|---|---:|---|
| `v02-real-world-repair-001..006` | 6 | frontend UI/errors: display, sort, and selection verbs without physical metaphors |
| `v02-real-world-repair-007..012` | 6 | comments: drag, layout, render, WebGL, pointer, and force behavior |
| `v02-real-world-repair-013..016` | 4 | commit subjects: drag state, alignment, central area, and edit controls |
| `v02-real-world-repair-017..018` | 2 | PR/review: concise cause, behavior, and verification wording |
| `v02-real-world-repair-019..020` | 2 | docs: version rows and recent result ordering |

Set `repeatCount: 3` on cases 001, 004, 007, 010, 013, 015, 017, and 019. All other repair cases use 1.
- [ ] **Step 4: Write the exact preserve matrix**

Create 10 natural inputs that must remain unchanged:

| IDs | Surface |
|---|---|
| `v02-preserve-001..003` | UI/error |
| `v02-preserve-004..005` | commit subject |
| `v02-preserve-006..007` | docs |
| `v02-preserve-008` | code comment |
| `v02-preserve-009` | PR |
| `v02-preserve-010` | review |

Every preserve case uses `requiredFormat: ["exact-output"]`, `repeatCount: 1`, and a `requiredSubstrings` entry containing the full original artifact. The prompt requests review and explicitly permits an unchanged answer when no objective problem exists. Use `ux-toss-principles-001`, `engineering-line-writing-001`, or the most relevant existing source ID.

- [ ] **Step 5: Add the minimal public workspace README**

State that every file is synthetic, uses `<workspace>` for paths, contains no production code, and exists only to provide stable evaluation context.

- [ ] **Step 6: Run focused validation**

```powershell
pnpm vitest run tests/eval/v02-data-pack.test.ts tests/eval/privacy.test.ts
pnpm typecheck
```

Expected: both partial files pass schema, evidence-link, repeat-count, and privacy checks. Full suite validation starts only after Task 8 creates the manifest and remaining files.

- [ ] **Step 7: Update the roadmap and commit**

```powershell
git add evals/cases/v0.2/repair.jsonl evals/cases/v0.2/preserve.jsonl evals/fixtures/v0.2/anonymized-workspace/README.md tests/eval/v02-data-pack.test.ts ROADMAP.md
git commit -m "test(eval): 실전 교정과 보존 사례 추가"
```
---

### Task 8: Author project-conflict, long-artifact, format, and boundary cases

**Files:**

- Create: `evals/cases/v0.2/manifest.json`
- Create: `evals/cases/v0.2/project-conflict.jsonl`
- Create: `evals/cases/v0.2/long-artifact.jsonl`
- Create: `evals/cases/v0.2/format.jsonl`
- Create: `evals/cases/v0.2/boundary.jsonl`
- Create: `evals/fixtures/v0.2/anonymized-workspace/packages/shared/vocabulary.md`
- Create: `evals/fixtures/v0.2/anonymized-workspace/packages/client/widget-copy.tsx`
- Create: `evals/fixtures/v0.2/anonymized-workspace/docs/widget-layout.md`
- Create: `tests/eval/v02-corpus.test.ts`
- Modify: `package.json`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: Tasks 1, 2, 5, and 7.
- Produces: the remaining 30 public cases and 12 repeated cases, completing the 60-case suite.
- [ ] **Step 1: Write the project-conflict matrix**

Create `v02-project-conflict-001..010`. Cases 001, 002, 004, 006, 008, and 010 use `repeatCount: 3`.

| IDs | Required project convention |
|---|---|
| 001–002 | preserve `위젯` and reject unapproved replacements |
| 003 | preserve `배치` for the layout concept |
| 004–005 | preserve grid `칸` and distinguish it from general `위치` |
| 006–007 | preserve `서랍` even when a generic guide suggests `드로어` |
| 008 | preserve an established 한다체 comment style |
| 009 | preserve the repository's commit-subject form |
| 010 | obey explicit user terminology over project and baseline defaults |

List approved terms in `preferred`, incorrect substitutions in `forbidden`, and matching deterministic forbidden-substring checks. Do not promote these local terms to global reference packs.

- [ ] **Step 2: Write the long-artifact matrix**

Create `v02-long-artifact-001..010`. Cases 001, 003, 005, 007, 009, and 010 use `repeatCount: 3`.

Cover four UI/error tasks, three technical documents, one PR body, one comment block, and one release note. Each input contains at least two of: identifiers, version numbers, CLI commands, keyboard keys, Markdown structure, or mixed Korean/English terminology. Protect exact values such as `AbortController`, `WebGL`, `Shift`, `Esc`, `v0.2.0`, and `pnpm check` only when present in the input.
- [ ] **Step 3: Write format and boundary matrices**

Create five format cases: one commit subject, one bullet list, one Markdown table, one exact-output review, and one single-line UI label. All use `repeatCount: 1` and exactly one matching `requiredFormat` value.

Create five boundary cases for architecture explanation, implementation planning, progress reporting, debugging conversation, and general technical Q&A. All use `surface: "conversation"`, `kind: "boundary"`, `repeatCount: 1`, and forbid turning the answer into an artifact rewrite.

- [ ] **Step 4: Add synthetic context files**

`vocabulary.md` defines only the fixture's approved `위젯`, `배치`, `칸`, and `서랍` terms. `widget-copy.tsx` contains synthetic UI constants and identifiers. `widget-layout.md` provides a short established 한다체 document. Use `<workspace>` in prose and no absolute path.

- [ ] **Step 5: Add the production manifest and full corpus test**

Create the manifest with file counts `repair=20`, `preserve=10`, `project-conflict=10`, `long-artifact=10`, `format=5`, and `boundary=5`, plus `totalCases: 60` and `repeatedCases: 20`. Create `tests/eval/v02-corpus.test.ts` to load the production manifest and assert those counts, unique IDs, valid research source links, 20 repeated cases, and 160 cases when combined with v0.1. Add `pnpm eval:v0.2:validate` to the existing `check` script only after this complete production suite passes.
- [ ] **Step 6: Run the complete suite and privacy validation**

```powershell
pnpm eval:v0.2:validate
pnpm vitest run tests/eval/v02-corpus.test.ts tests/eval/privacy.test.ts tests/eval/hard-failures.test.ts
pnpm check
```

Expected: 60 v0.2 cases, 20 repeated cases, 160 total v0.1+v0.2 cases, zero privacy violations, and a green full check.

- [ ] **Step 7: Review every anonymized-derived case**

For each case, compare only against the local source during review, then confirm that the public case contains the minimum necessary context and no recoverable private path, branch, commit, internal identifier, or source block. Record the review by keeping `privacyReviewed: true`; do not add local provenance to Git.

- [ ] **Step 8: Update the roadmap and commit**

```powershell
git add evals/cases/v0.2 evals/fixtures/v0.2 tests/eval/v02-corpus.test.ts package.json ROADMAP.md
git commit -m "test(eval): v0.2 공개 평가 세트 완성"
```
---

### Task 9: Add the read-only local repository audit runner

**Files:**

- Create: `src/eval/local-suite.ts`
- Create: `src/eval/local-audit-cli.ts`
- Create: `tests/eval/local-suite.test.ts`
- Create: `docs/evals/v0.2-local-audit.md`
- Modify: `package.json`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: an ignored local manifest, `executeCodexPrompt()`, and append-only run storage.
- Produces: `loadLocalSourceManifest()`, `readLocalSourceContext()`, and `pnpm eval:v0.2:local`.
- Writes only under an explicit output path whose default is `.local/evals/v0.2/`.
- [ ] **Step 1: Write path containment and read-only tests**

Create `tests/eval/local-suite.test.ts` with these assertions:

```ts
const context = await readLocalSourceContext(manifest, {
  id: "local-001",
  relativePath: "src/copy.ts",
  startLine: 2,
  endLine: 3,
});
expect(context).toBe("둘째 줄\n셋째 줄");
await expect(
  readLocalSourceContext(manifest, caseWith({ relativePath: "../secret.txt" })),
).rejects.toThrow("Local source path escapes repository root");
```

Also reject absolute Windows, WSL, and POSIX paths in `relativePath`. Hash every temporary source file before and after a stubbed local run and expect identical hashes.

- [ ] **Step 2: Run the focused test and confirm failure**

```powershell
pnpm vitest run tests/eval/local-suite.test.ts
```

Expected: FAIL because `local-suite.ts` does not exist.
- [ ] **Step 3: Implement the local source manifest**

Create `src/eval/local-suite.ts` with a Zod schema containing `repositoryRoot`, `baseRef`, and cases with `id`, `relativePath`, `startLine`, `endLine`, `surface`, `domain`, `instruction`, `projectVocabulary`, `protectedTokens`, and `repeatCount`. Export:

```ts
export async function loadLocalSourceManifest(path: string): Promise<LocalSourceManifest>;
export async function readLocalSourceContext(
  manifest: LocalSourceManifest,
  item: LocalSourceCase,
): Promise<string>;
```

Resolve the repository root and candidate path before reading. Require the final candidate path to remain inside the root, require positive line numbers with `endLine >= startLine`, and reject missing or binary files.

- [ ] **Step 4: Implement the local audit CLI**

Add `"eval:v0.2:local": "tsx src/eval/local-audit-cli.ts"` to `package.json`. `src/eval/local-audit-cli.ts` accepts:

```text
--manifest .local/evals/v0.2/source-manifest.json
--mode baseline|explicit
--model <model>
--reasoning-effort <effort>
--output .local/evals/v0.2/<mode>/runs.jsonl
```

Build prompts from the declared instruction and exact line range, run Codex with `--sandbox read-only --cd <repositoryRoot>`, and append results under `.local/`. Capture `git status --porcelain` before and after; fail the local audit if the source worktree changes.

- [ ] **Step 5: Write the local runbook**

`docs/evals/v0.2-local-audit.md` documents the ignored manifest shape, read-only guarantee, allowed source types, result location, status-before/status-after check, and the rule that no raw local output is copied into public results.

- [ ] **Step 6: Run focused and full tests**

```powershell
pnpm vitest run tests/eval/local-suite.test.ts tests/eval/v02-codex-runner.test.ts
pnpm check
```

Expected: PASS; the test repository hashes and Git status remain unchanged.

- [ ] **Step 7: Update the roadmap and commit**

```powershell
git add src/eval/local-suite.ts src/eval/local-audit-cli.ts tests/eval/local-suite.test.ts docs/evals/v0.2-local-audit.md package.json ROADMAP.md
git commit -m "feat(eval): 로컬 저장소 읽기 전용 검사 추가"
```
---

### Task 10: Run local stress tests and collect public raw results

**Files:**

- Create locally: `.local/evals/v0.2/source-manifest.json`
- Create locally: `.local/evals/v0.2/<mode>/runs.jsonl`
- Create: `evals/results/v0.2/<mode>/run-manifest.json`
- Create: `evals/results/v0.2/<mode>/runs.jsonl`
- Create: `evals/results/v0.2/v0.1-regression/run-manifest.json`
- Create: `evals/results/v0.2/v0.1-regression/runs.jsonl`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: the public suite, local runner, Codex runner, and `0.2.0-rc.1` plugin candidate.
- Produces: append-only public runs and ignored local corroboration results.
- [ ] **Step 1: Create and verify the release-candidate plugin build**

Set the plugin version to `0.2.0-rc.1`, run the official plugin and skill validators, and update the local cachebuster through the plugin-creator workflow. Build the candidate but keep `korean-context@personal` absent until Step 4. Record `codex --version`, model `gpt-5.6-sol`, reasoning effort `xhigh`, plugin version, and fixture hash.

- [ ] **Step 2: Run the local Offen audit without modifying it**

Create the ignored source manifest from reviewed UI, comment, commit, PR, and documentation locations. Confirm Korean Context is absent, save Git status, run local baseline, and require byte-identical status afterward.

```powershell
pnpm eval:v0.2:local -- --manifest .local/evals/v0.2/source-manifest.json --mode baseline --model gpt-5.6-sol --reasoning-effort xhigh --output .local/evals/v0.2/baseline/runs.jsonl
```

Run the existing Offen copy scanners separately and retain only local aggregate coverage. Do not copy private raw outputs into this repository.
- [ ] **Step 3: Run the public baseline with Korean Context absent**

Remove only `korean-context@personal`, confirm it is absent from `codex plugin list`, and run:

```powershell
pnpm eval:v0.2:run -- --suite v0.2 --mode baseline --model gpt-5.6-sol --reasoning-effort xhigh --output evals/results/v0.2/baseline/runs.jsonl
```

Expected: 100 effective runs: 40 single-attempt cases and 20 cases with three attempts.

- [ ] **Step 4: Install the candidate and run explicit mode**

Install the exact candidate and read back `0.2.0-rc.1`. Run local explicit mode first and confirm the Offen status remains unchanged, then run the public explicit suite:

```powershell
pnpm eval:v0.2:local -- --manifest .local/evals/v0.2/source-manifest.json --mode explicit --model gpt-5.6-sol --reasoning-effort xhigh --output .local/evals/v0.2/explicit/runs.jsonl
pnpm eval:v0.2:run -- --suite v0.2 --mode explicit --model gpt-5.6-sol --reasoning-effort xhigh --plugin-version 0.2.0-rc.1 --output evals/results/v0.2/explicit/runs.jsonl
```

Expected: 100 effective explicit runs with the same Codex version, model, effort, and fixture hash as baseline.

- [ ] **Step 5: Run all 100 v0.1 cases as explicit regressions**

```powershell
pnpm eval:v0.2:run -- --suite v0.1-regression --mode explicit --model gpt-5.6-sol --reasoning-effort xhigh --plugin-version 0.2.0-rc.1 --output evals/results/v0.2/v0.1-regression/runs.jsonl
```

Expected: 100 successful single-attempt legacy runs.

- [ ] **Step 6: Validate completeness without scoring quality yet**

```powershell
pnpm eval:v0.2:validate
pnpm test
```

Require 100 baseline, 100 explicit, and 100 legacy effective runs. Infrastructure failures must be retried under the same composite key and preserved in raw JSONL.

- [ ] **Step 7: Review public outputs for privacy and commit raw evidence**

```powershell
pnpm eval:v0.2:validate
git add evals/results/v0.2 plugins/korean-context/.codex-plugin/plugin.json ROADMAP.md
git commit -m "test(eval): v0.2 원본 실행 결과 기록"
```
---

### Task 11: Score results, fix regressions, and pass the gate

**Files:**

- Create: `evals/results/v0.2/automatic.jsonl`
- Create: `evals/results/v0.2/scores/scores.jsonl`
- Create: `evals/results/v0.2/gate.json`
- Modify only when a failure proves it necessary: `plugins/korean-context/skills/korean-context/SKILL.md`
- Modify only when a failure proves it necessary: the narrowest `plugins/korean-context/skills/korean-context/references/*.md`
- Modify only when a failure proves it necessary: the matching v0.2 regression case
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: 300 effective public runs, v0.2 rubric, and deterministic checks.
- Produces: one automatic evaluation per v0.2 run, manual scores, and `gate.json`.

- [ ] **Step 1: Generate deterministic evaluations**

Run automatic checks for all baseline and explicit v0.2 attempts and write one record per composite key to `automatic.jsonl`. Baseline language failures are comparison evidence, not product release failures; baseline must still satisfy execution completeness, configuration consistency, privacy, and non-empty output requirements. All explicit automatic violations enter the release gate.

- [ ] **Step 2: Prepare a mode-blind review worksheet**

Copy the 200 effective v0.2 outputs into an ignored `.local/evals/v0.2/review/` worksheet with deterministic shuffled `reviewId` values and no mode label. Keep the reviewId-to-composite-key mapping in the same ignored directory. Do not edit raw run files.

- [ ] **Step 3: Score every v0.2 attempt**

For every review ID, record the five 0–2 scores, all boolean failure fields, gold issue totals and corrected counts, and a non-empty rationale. After completing the blind pass, restore `caseId`, `mode`, and `attempt` from the mapping and write `scores/scores.jsonl` in composite-key order.

- [ ] **Step 4: Re-review borderline and hard-failure records**

A second pass reviews every score with any 0 or 1, every boolean failure, every baseline/explicit disagreement, and every repeated-case disagreement. Change a score only with a written rationale; do not hide disagreement by averaging it away.

- [ ] **Step 5: Run the release gate**

```powershell
pnpm eval:v0.2:score -- --manifest evals/cases/v0.2/manifest.json --baseline-runs evals/results/v0.2/baseline/runs.jsonl --explicit-runs evals/results/v0.2/explicit/runs.jsonl --scores evals/results/v0.2/scores/scores.jsonl --v01-regression-runs evals/results/v0.2/v0.1-regression/runs.jsonl --output evals/results/v0.2/gate.json
```

Expected before release: `passed: true`, zero hard failures, unnecessary rewrite at most 5%, format adherence at least 95%, gold correction at least 90%, and repeated hard-failure variance 0.
- [ ] **Step 6: Apply the failure-driven correction loop when the gate fails**

For each failure, first strengthen or add the narrowest public regression case. Modify only the responsible core, surface, or domain reference. Use this routing:

```text
boundary or activation -> SKILL.md and core-artifact-boundary.md
unnatural wording      -> core-naturalness.md or core-translationese.md
project term conflict  -> core-terminology.md
register mismatch      -> core-register.md or the relevant surface file
specialist term error  -> the relevant domain file
format failure         -> the relevant surface file
```

Increment the candidate version to the next `0.2.0-rc.N`, reinstall through the plugin-creator workflow, rerun every explicit v0.2 and v0.1 regression attempt under one configuration, rescore affected records, and rerun the entire gate. Do not add a second generation or judge pass.

- [ ] **Step 7: Run the complete deterministic regression**

```powershell
pnpm check
pnpm eval:v0.2:validate
pnpm eval:v0.2:score -- --manifest evals/cases/v0.2/manifest.json --baseline-runs evals/results/v0.2/baseline/runs.jsonl --explicit-runs evals/results/v0.2/explicit/runs.jsonl --scores evals/results/v0.2/scores/scores.jsonl --v01-regression-runs evals/results/v0.2/v0.1-regression/runs.jsonl --output evals/results/v0.2/gate.json
```

Expected: every command exits 0 and `gate.json` contains `passed: true`.

- [ ] **Step 8: Update the roadmap and commit scores and fixes**

Commit a rule fix separately from final scoring when both exist. The final evidence commit is:

```powershell
git add evals/results/v0.2 plugins/korean-context/skills/korean-context ROADMAP.md
git commit -m "test(eval): v0.2 품질 게이트 통과"
```
---

### Task 12: Publish the v0.2 prerelease

**Files:**

- Create: `evals/results/v0.2/summary.md`
- Create: `docs/releases/v0.2.0.md`
- Modify: `plugins/korean-context/.codex-plugin/plugin.json`
- Modify: `README.md`
- Modify: `docs/support-matrix.md`
- Modify: `CHANGELOG.md`
- Modify: `ROADMAP.md`

**Interfaces:**

- Consumes: passing `gate.json`, clean public results, and a green release candidate.
- Produces: final `0.2.0` plugin metadata, public report, GitHub tag, and prerelease.

- [ ] **Step 1: Write the evidence-backed summary**

`evals/results/v0.2/summary.md` reports exact run counts, model and Codex versions, baseline/explicit paired outcomes, five-score averages, every hard-failure count, preservation and format rates, gold correction rate, repeated-case stability, v0.1 regression status, and local audit aggregate counts. State that the public set is anonymized, scoring is manual, outputs vary by model, and local Offen results are not independently reproducible.

- [ ] **Step 2: Update public release documentation**

Update README measured results, support matrix date/version, changelog, and `docs/releases/v0.2.0.md`. Do not claim Claude Code support, implicit activation improvement, npm availability, or general quality beyond the fixed evaluation.

- [ ] **Step 3: Finalize plugin version and rerun installation lifecycle**

Set the release version to `0.2.0`, validate the plugin and skill, then verify install, same-version reinstall, remove, and final reinstall without changing another plugin or marketplace. Save the sanitized lifecycle evidence under `evals/results/v0.2/install-lifecycle.json` and restore the final installed state.

- [ ] **Step 4: Run every release check**

```powershell
pnpm check
pnpm eval:v0.2:validate
pnpm eval:v0.2:score -- --manifest evals/cases/v0.2/manifest.json --baseline-runs evals/results/v0.2/baseline/runs.jsonl --explicit-runs evals/results/v0.2/explicit/runs.jsonl --scores evals/results/v0.2/scores/scores.jsonl --v01-regression-runs evals/results/v0.2/v0.1-regression/runs.jsonl --output evals/results/v0.2/gate.json
git diff --check
git status --short
```

Also run the current official plugin and skill validators. Expected: all commands exit 0, `gate.json` passes, and only intended release files are changed.

- [ ] **Step 5: Mark v0.2 complete in the roadmap and commit**

Check every evidenced Milestone 1 item, set the next milestone to v0.3 Claude Code support, set the next task to current Claude platform research, and add a session-log entry with result paths.

```powershell
git add plugins/korean-context/.codex-plugin/plugin.json evals/results/v0.2 README.md docs/support-matrix.md CHANGELOG.md docs/releases/v0.2.0.md ROADMAP.md
git commit -m "docs(release): v0.2.0 검증 결과 확정"
```
- [ ] **Step 6: Push main and require green remote CI**

```powershell
git push origin main
gh run list --repo Jigoooo/korean-context --branch main --limit 1
gh run watch --repo Jigoooo/korean-context --exit-status
```

Expected: Windows, macOS, and Linux jobs pass at the release commit. Do not create the tag while a job is pending or failing.

- [ ] **Step 7: Create and verify the GitHub prerelease**

```powershell
git tag -a v0.2.0 -m "Korean Context v0.2.0"
git push origin v0.2.0
gh release create v0.2.0 --repo Jigoooo/korean-context --prerelease --title "Korean Context v0.2.0" --notes-file docs/releases/v0.2.0.md
gh release view v0.2.0 --repo Jigoooo/korean-context
```

Expected: the public prerelease points to the green release commit and displays the checked-in release notes.
- [ ] **Step 8: Run post-release installation smoke and final readback**

Refresh the GitHub marketplace at tag `v0.2.0`, install the plugin, run one explicit public repair case and one preserve case, then remove and reinstall the plugin.

```powershell
git rev-list --left-right --count main...origin/main
git status --short --branch
gh release view v0.2.0 --repo Jigoooo/korean-context
```

Expected: divergence `0 0`, clean worktree, public prerelease present, and both smoke cases satisfy their automatic checks.

---

## Plan self-review checklist

- [x] Every requirement in the v0.2 design maps to a task above.
- [x] All created and modified files have one stated responsibility.
- [x] v0.1 schemas, cases, outputs, and scoring remain backward compatible.
- [x] Baseline quality failures remain comparison evidence; only baseline infrastructure and privacy failures block execution.
- [x] Explicit v0.2 and v0.1 regression failures enter the release gate.
- [x] Public and local source boundaries are enforced in tests and documentation.
- [x] No implementation step depends on an undefined function or type.
- [x] No task contains a placeholder or an unbounded error-handling instruction.

## Execution handoff

Start with Task 1 in a clean isolated worktree. Finish one task, run its checks, review the diff, update `ROADMAP.md`, and commit before starting the next task. Model runs in Tasks 10 and 11 are release evidence and must not start until Tasks 1–9 and the public suite pass deterministic checks.