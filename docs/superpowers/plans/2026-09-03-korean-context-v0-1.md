# Korean Context v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codex에서 실제 설치하고 검증할 수 있는 Korean Context skills-only 플러그인을 만들고, 품질 게이트를 통과한 `v0.1.0`을 GitHub 프리릴리스와 OpenAI 공개 플러그인 제출물로 배포한다.

**Architecture:** 저장소 루트는 평가 도구, 연구 근거, 문서, CI를 담당하고 배포 단위는 `plugins/korean-context` 아래에 격리한다. 언어 정책은 플러그인 내부의 단일 스킬과 얕은 참조 파일만을 원본으로 삼으며, TypeScript 도구는 매니페스트·평가 코퍼스·결과를 검증하되 플러그인 런타임에는 포함되지 않는다.

**Tech Stack:** Node.js 20+, TypeScript, pnpm 11, Vitest, Zod, YAML, Execa, Python 3.12 plugin validators, Codex CLI 0.147+, GitHub CLI

**Spec:** `docs/superpowers/specs/2026-09-03-korean-context-v0-1-design.md`

## Global Constraints

- 릴리스 식별자는 `korean-context`와 `0.1.0`을 사용한다.
- GitHub 저장소는 `Jigoooo/korean-context`, 공개 가시성, MIT 라이선스로 만든다.
- v0.1은 Codex 중심 프리릴리스이며 전체 V1 또는 엄격한 Phase 0 통과를 주장하지 않는다.
- 플러그인은 skills-only다. MCP 서버, 앱, UI, 훅을 추가하지 않는다.
- 일반 대화에는 적용하지 않고 저장·게시되는 한국어 산출물에만 적용한다.
- 명시적 사용자 지시, 기존 산출물 문체, 프로젝트 관례가 Korean Context 기본값보다 우선한다.
- 언어 정책 원본은 `plugins/korean-context/skills/korean-context` 하나만 둔다.
- 플러그인 런타임은 네트워크, 백그라운드 프로세스, 추가 모델 호출, 사용자 학습 DB를 사용하지 않는다.
- 검증하지 않은 에이전트나 동작을 지원한다고 표시하지 않는다.
- 검증 게이트가 하나라도 실패하면 GitHub 릴리스와 공개 디렉터리 제출을 중단한다.
- 기존 `plans/korean-context-full-plan`은 내용 변경 없이 원본 계획 자료로 추적한다.
- 비밀, 토큰, 사용자 전체 설정, 실제 사용자 소스 코드를 저장소나 평가 결과에 기록하지 않는다.

---

## File Map

| 경로 | 책임 |
|---|---|
| `plugins/korean-context/.codex-plugin/plugin.json` | 설치 가능한 플러그인 식별자와 공개 메타데이터 |
| `plugins/korean-context/skills/korean-context/SKILL.md` | 적용 경계와 참조 라우팅 |
| `plugins/korean-context/skills/korean-context/references` | 언어 정책의 단일 원본 |
| `.agents/plugins/marketplace.json` | 저장소 로컬 마켓플레이스 항목 |
| `src/plugin` | 매니페스트·마켓플레이스 구조 검증 |
| `src/research` | 연구 근거 메타데이터 검증 |
| `src/eval` | 평가 로딩, Codex 실행, 점수 집계 |
| `research/sources.yml` | 규칙과 용어의 출처·판단 기록 |
| `evals/cases` | 100개 평가 케이스 |
| `evals/results/v0.1` | 기준선과 플러그인 비교 결과 |
| `.github/workflows/ci.yml` | 3개 OS 자동 검증 |
| `docs/plugin-submission.md` | 공개 플러그인 제출 자료 |

### Task 1: 저장소와 TypeScript 검증 도구 부트스트랩

**Files:**
- Create: `.gitignore`
- Create: `.gitattributes`
- Create: `.editorconfig`
- Create: `.prettierignore`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `vitest.config.ts`
- Create: `tests/repository-layout.test.ts`
- Track unchanged: `plans/korean-context-full-plan`

**Interfaces:**
- Consumes: 승인된 설계와 현재 Node.js 24/pnpm 11 환경
- Produces: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check` 명령과 ESM TypeScript 환경

- [ ] **Step 1: 루트 도구 설정 작성**

`package.json`은 다음 스크립트와 제약을 갖는다.

```json
{
  "name": "korean-context-dev",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.22.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "research:validate": "tsx src/research/cli.ts",
    "eval:validate": "tsx src/eval/validate-cli.ts",
    "eval:run": "tsx src/eval/run-cli.ts",
    "eval:score": "tsx src/eval/score-cli.ts",
    "plugin:validate": "tsx src/plugin/validate-cli.ts",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm research:validate && pnpm eval:validate && pnpm plugin:validate"
  }
}
```

`tsconfig.json`은 `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`를 사용한다. ESLint는 flat config와 `typescript-eslint` recommended type-checked 규칙을 사용한다.

`.gitignore`는 `node_modules/`, `dist/`, `coverage/`, `.env`, `.env.*`를 제외하되 `.env.example`은 허용한다. `.prettierignore`는 원본 `plans/`와 raw `evals/results/`를 제외한다. `.gitattributes`는 텍스트 LF와 PNG binary를 선언하고 `.editorconfig`는 UTF-8, LF, final newline, 2-space indent를 고정한다.

- [ ] **Step 2: 개발 의존성 설치**

```powershell
pnpm add -D typescript tsx vitest eslint @eslint/js typescript-eslint prettier zod yaml execa @types/node
```

Expected: `pnpm-lock.yaml`이 생성되고 오류 없이 끝난다.

- [ ] **Step 3: 저장소 계약 테스트 작성**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository contract", () => {
  it("pins pnpm and supports Node 20 or newer", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      packageManager: string;
      engines: { node: string };
      private: boolean;
    };
    expect(pkg.private).toBe(true);
    expect(pkg.packageManager).toBe("pnpm@11.22.0");
    expect(pkg.engines.node).toBe(">=20");
  });
});
```

- [ ] **Step 4: 기본 검증 실행**

```powershell
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

Expected: 네 명령이 모두 exit code 0으로 끝난다.

- [ ] **Step 5: 부트스트랩 커밋**

```powershell
git add .gitignore .gitattributes .editorconfig .prettierignore package.json pnpm-lock.yaml tsconfig.json eslint.config.js vitest.config.ts tests/repository-layout.test.ts plans/korean-context-full-plan
git commit -m "chore(repo): v0.1 개발 환경 구성"
```

### Task 2: 연구 근거 레지스트리 구축

**Files:**
- Create: `research/sources.yml`
- Create: `research/reference-mining/README.md`
- Create: `src/research/schema.ts`
- Create: `src/research/load-sources.ts`
- Create: `src/research/cli.ts`
- Create: `tests/research/source-registry.test.ts`

**Interfaces:**
- Consumes: 원본 계획의 증거 계층과 현재 공개 자료
- Produces: `loadSources(path): Promise<SourceRecord[]>`, `SourceRecordSchema`, 최소 12개 근거 레코드

- [ ] **Step 1: 실패하는 레지스트리 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { loadSources } from "../../src/research/load-sources.js";

describe("research source registry", () => {
  it("contains diverse, reviewable evidence", async () => {
    const sources = await loadSources("research/sources.yml");
    expect(sources.length).toBeGreaterThanOrEqual(12);
    expect(new Set(sources.map((source) => source.category))).toEqual(
      new Set(["existing-skill", "engineering", "ux", "security"]),
    );
    expect(sources.every((source) => source.checkedAt === "2026-09-03")).toBe(true);
    expect(sources.every((source) => source.finding.length >= 20)).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```powershell
pnpm vitest run tests/research/source-registry.test.ts
```

Expected: `loadSources` 모듈이 없어 FAIL한다.

- [ ] **Step 3: 스키마와 로더 구현**

```ts
import { z } from "zod";

export const SourceRecordSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.string().url().or(z.string().startsWith("local:")),
  checkedAt: z.literal("2026-09-03"),
  category: z.enum(["existing-skill", "engineering", "ux", "security"]),
  originalLanguage: z.enum(["ko", "translated", "unknown"]),
  authorType: z.enum(["practitioner", "vendor", "official-org", "community"]),
  surface: z.array(z.string().min(1)).min(1),
  domain: z.array(z.string().min(1)).min(1),
  finding: z.string().min(20),
  decision: z.enum(["reuse", "adapt", "reject"]),
  generalizedRule: z.string().min(20),
  exceptions: z.array(z.string().min(1)),
  evalIds: z.array(z.string().min(1)),
});

export type SourceRecord = z.infer<typeof SourceRecordSchema>;
```

`loadSources`는 YAML 전체를 `SourceRecordSchema.array()`로 검증한다. CLI는 출처 수와 카테고리별 개수를 출력하고 오류가 있으면 exit code 1을 반환한다.

- [ ] **Step 4: 현재 자료 조사와 레지스트리 작성**

최소 12개 레코드: 현재 Humanize Korean 계열 1개, Fluent Korean 또는 동등 스킬 1개, 한국 개발자 원문 엔지니어링·OSS 자료 4개 이상, 한국 제품·UX 작성 자료 2개 이상, KrCERT/KISA 또는 한국 보안 실무자·벤더 원문 4개 이상.

문장을 복사하지 않고 사용 경향, 용어 상태, 문체, 실패 패턴만 요약한다. 다단계 전체 재작성, AI 탐지 점수, 일반 대화 말투 강제는 `reject`로 기록한다.

- [ ] **Step 5: 테스트와 커밋**

```powershell
pnpm vitest run tests/research/source-registry.test.ts
pnpm research:validate
git add research src/research tests/research
git commit -m "docs(research): 한국어 작성 근거 레지스트리 추가"
```

### Task 3: 평가 스키마와 100개 코퍼스 구축

**Files:**
- Create: `src/eval/types.ts`
- Create: `src/eval/schema.ts`
- Create: `src/eval/load-cases.ts`
- Create: `src/eval/validate-cli.ts`
- Create: `evals/cases/repair.jsonl`
- Create: `evals/cases/generation.jsonl`
- Create: `evals/cases/preserve.jsonl`
- Create: `evals/cases/conflict.jsonl`
- Create: `evals/cases/transfer.jsonl`
- Create: `evals/cases/boundary.jsonl`
- Create: `evals/rubric.md`
- Create: `evals/fixtures/workspace/README.md`
- Create: `tests/eval/corpus.test.ts`

**Interfaces:**
- Consumes: `research/sources.yml`와 설계의 분포
- Produces: `loadEvalCases(directory): Promise<EvalCase[]>`, 정확히 100개 코퍼스, live 30개

- [ ] **Step 1: 실패하는 코퍼스 계약 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { loadEvalCases } from "../../src/eval/load-cases.js";

describe("v0.1 evaluation corpus", () => {
  it("has the exact category distribution", async () => {
    const cases = await loadEvalCases("evals/cases");
    const count = (kind: string) => cases.filter((item) => item.kind === kind).length;
    expect(cases).toHaveLength(100);
    expect(count("repair")).toBe(45);
    expect(count("generation")).toBe(15);
    expect(count("preserve")).toBe(10);
    expect(count("conflict")).toBe(10);
    expect(count("transfer")).toBe(10);
    expect(count("boundary")).toBe(10);
  });

  it("selects the exact 30-case live set", async () => {
    const live = (await loadEvalCases("evals/cases")).filter((item) => item.live);
    const count = (kind: string) => live.filter((item) => item.kind === kind).length;
    expect(live).toHaveLength(30);
    expect(count("repair")).toBe(10);
    expect(count("generation")).toBe(5);
    expect(count("preserve")).toBe(5);
    expect(count("conflict")).toBe(3);
    expect(count("transfer")).toBe(3);
    expect(count("boundary")).toBe(4);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```powershell
pnpm vitest run tests/eval/corpus.test.ts
```

Expected: 평가 로더가 없어 FAIL한다.

- [ ] **Step 3: 평가 타입과 스키마 구현**

```ts
import { z } from "zod";

export const EvalCaseSchema = z.object({
  id: z.string().regex(/^(repair|generation|preserve|conflict|transfer|boundary)-\d{3}$/),
  kind: z.enum(["repair", "generation", "preserve", "conflict", "transfer", "boundary"]),
  surface: z.enum(["commit", "pr", "issue", "review", "comment", "docs", "ui", "error", "test", "release", "conversation"]),
  domain: z.enum(["software", "frontend", "backend", "infra", "security-common", "security-appsec", "security-vulnerability", "security-pentest-redteam"]),
  input: z.string().min(1),
  expectedBehavior: z.array(z.string().min(1)).min(1),
  forbiddenBehavior: z.array(z.string().min(1)),
  protectedTokens: z.array(z.string().min(1)),
  expectedRegister: z.enum(["해요체", "합니다체", "한다체", "phrase", "unchanged"]),
  sourceIds: z.array(z.string().min(1)).min(1),
  live: z.boolean(),
});
```

로더는 여섯 JSONL 파일만 읽고 빈 줄을 무시하며 파일명과 kind 불일치 또는 중복 ID에서 실패한다.

- [ ] **Step 4: 100개 평가 케이스 작성**

ID 범위: repair 001-045, generation 001-015, preserve 001-010, conflict 001-010, transfer 001-010, boundary 001-010.

표면 분포: commit 10, pr 10, issue 8, review 10, comment 10, docs 12, ui 10, error 8, test 6, release 6, conversation 10. 분야 분포: software 32, frontend 12, backend 12, infra 10, security-common 10, security-appsec 8, security-vulnerability 8, security-pentest-redteam 8.

```json
{"id":"repair-001","kind":"repair","surface":"docs","domain":"software","input":"캐시의 무효화를 수행한다.","expectedBehavior":["캐시를 무효화한다처럼 직접적인 동사를 사용한다"],"forbiddenBehavior":["기술적 의미를 바꾼다"],"protectedTokens":["캐시"],"expectedRegister":"한다체","sourceIds":["existing-humanize-001"],"live":true}
{"id":"boundary-001","kind":"boundary","surface":"conversation","domain":"software","input":"이 아키텍처가 왜 필요한지 설명해줘.","expectedBehavior":["일반 설명에 산출물 문체를 강제하지 않는다"],"forbiddenBehavior":["설명 전체를 교정한다"],"protectedTokens":[],"expectedRegister":"unchanged","sourceIds":["existing-skill-boundary-001"],"live":true}
```

각 일반화 규칙은 최소 하나의 transfer case와 연결하고 코드, 버전, CVE, 함수명, URL, 숫자는 protectedTokens에 기록한다.

- [ ] **Step 5: 분포·출처·보호 토큰 검증**

모든 sourceIds 존재, ID 고유, 표면·분야 분포, 경계 10개의 conversation 표면, live 분포, 일반화 규칙별 transfer case를 검사한다.

```powershell
pnpm eval:validate
pnpm vitest run tests/eval/corpus.test.ts
```

Expected: `Validated 100 cases; live set 30`을 출력하고 PASS한다.

- [ ] **Step 6: 평가 코퍼스 커밋**

```powershell
git add src/eval/types.ts src/eval/schema.ts src/eval/load-cases.ts src/eval/validate-cli.ts evals tests/eval/corpus.test.ts
git commit -m "test(eval): v0.1 한국어 평가 100건 구성"
```

### Task 4: Codex 실행기와 기준선 결과 구축

**Files:**
- Create: `src/eval/result-schema.ts`
- Create: `src/eval/codex-runner.ts`
- Create: `src/eval/run-cli.ts`
- Create: `src/eval/score.ts`
- Create: `src/eval/score-cli.ts`
- Create: `tests/eval/codex-runner.test.ts`
- Create: `tests/eval/score.test.ts`
- Create: `evals/results/v0.1/baseline/summary.json`
- Create: `evals/results/v0.1/baseline/runs.jsonl`

**Interfaces:**
- Consumes: `EvalCase[]`, mode `baseline | explicit | implicit`, Codex CLI
- Produces: `runCodexCase(input): Promise<EvalRun>`, `summarizeScores(scores): GateSummary`, 기준선 30건

- [ ] **Step 1: 실패하는 실행기 테스트 작성**

```ts
import { describe, expect, it, vi } from "vitest";
import { buildPrompt, runCodexCase } from "../../src/eval/codex-runner.js";

describe("Codex evaluation runner", () => {
  it("adds explicit invocation only in explicit mode", () => {
    expect(buildPrompt("문구를 고쳐줘", "explicit")).toContain("$korean-context");
    expect(buildPrompt("문구를 고쳐줘", "implicit")).toBe("문구를 고쳐줘");
    expect(buildPrompt("문구를 고쳐줘", "baseline")).toBe("문구를 고쳐줘");
  });

  it("never invokes a shell", async () => {
    const execute = vi.fn().mockResolvedValue({
      exitCode: 0,
      stdout: "{\"type\":\"turn.completed\"}",
      stderr: "",
    });
    await runCodexCase(
      { id: "repair-001", input: "문구를 고쳐줘" },
      "baseline",
      execute,
    );
    expect(execute.mock.calls[0][1].options.shell).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```powershell
pnpm vitest run tests/eval/codex-runner.test.ts tests/eval/score.test.ts
```

Expected: 실행기와 점수 집계 모듈이 없어 FAIL한다.

- [ ] **Step 3: 비대화형 실행기 구현**

prompt는 stdin으로 보내고 `shell: false`, `--ephemeral`, `--json`, `--sandbox read-only`, `--cd evals/fixtures/workspace`를 고정한다.

```ts
const args = [
  "exec",
  "--ephemeral",
  "--json",
  "--sandbox",
  "read-only",
  "--cd",
  "evals/fixtures/workspace",
  "-",
];

const result = await execa("codex", args, {
  input: buildPrompt(evalCase.input, mode),
  reject: false,
  shell: false,
  timeout: 180_000,
});
```

결과에 case ID, mode, 시작·종료 시각, Codex 버전, model, exit code, 최종 메시지, stderr를 저장한다. 동시 실행은 2개로 제한하고 성공한 case ID는 재개 시 건너뛴다.

- [ ] **Step 4: 수동 점수 스키마와 게이트 집계 구현**

```ts
export type EvalScore = {
  caseId: string;
  mode: "baseline" | "explicit" | "implicit";
  naturalness: 0 | 1 | 2;
  terminology: 0 | 1 | 2;
  meaningPreservation: 0 | 1 | 2;
  surfaceFit: 0 | 1 | 2;
  translationese: 0 | 1 | 2;
  technicalCorruption: boolean;
  severeTerminologyError: boolean;
  boundaryViolation: boolean;
  unnecessaryRewrite: boolean;
  improvedOverBaseline: boolean;
  notes: string;
};
```

`score-cli.ts`는 누락 점수에서 실패하고 모드별 평균과 릴리스 게이트를 계산한다. 별도 LLM judge는 사용하지 않는다.

- [ ] **Step 5: 실행기와 집계 테스트 통과**

```powershell
pnpm vitest run tests/eval/codex-runner.test.ts tests/eval/score.test.ts
pnpm typecheck
```

Expected: mock 실행, timeout, 실패 재개, 누락 점수, 게이트 실패 테스트가 PASS한다.

- [ ] **Step 6: 플러그인 미설치 상태에서 기준선 30건 실행**

```powershell
codex plugin list --json
pnpm eval:run -- --mode baseline --live-only
```

Expected: Korean Context가 없고 30개 실행이 완료된다. 기존 설치가 있으면 marketplace와 version을 기록하고 Korean Context 항목만 제거한다.

- [ ] **Step 7: 기준선 결과 커밋**

토큰·개인 경로·자격 증명을 제거하고 summary에 Codex 버전, model, 날짜, 성공/실패 수를 기록한다.

```powershell
git add src/eval tests/eval evals/results/v0.1/baseline
git commit -m "test(eval): Codex v0.1 기준선 기록"
```

### Task 5: 플러그인 스캐폴드와 공개 메타데이터 구성

**Files:**
- Create: `.agents/plugins/marketplace.json`
- Create: `plugins/korean-context/.codex-plugin/plugin.json`
- Create: `plugins/korean-context/assets/icon.png`
- Create: `plugins/korean-context/assets/logo.png`
- Create: `plugins/korean-context/assets/logo-dark.png`
- Create: `tests/plugin/manifest.test.ts`

**Interfaces:**
- Consumes: plugin-creator, `Jigoooo` identity, MIT 결정
- Produces: `korean-context@personal` repo marketplace 항목과 검증 가능한 manifest

- [ ] **Step 1: 구현 전 필수 스킬 로드**

`plugin-creator`를 읽고 스캐폴드·검증 절차를 따른다. 로고 생성에는 `brand-asset-creation`을 사용한다. 브리프는 정사각형, 한글 `한` 중심, 배경 `#111827`, 전경 `#FFFFFF`, 그라데이션·그림자·제3자 상표 없음, icon 128×128 PNG, logo와 logo-dark 512×512 PNG다.

- [ ] **Step 2: plugin과 repo marketplace 스캐폴드 생성**

`codex plugin marketplace list --json`으로 이름 충돌을 확인한다. 현재 `personal` 이름이 비어 있으므로 기본 이름을 사용한다.

```powershell
python C:\Users\PC\.codex\skills\.system\plugin-creator\scripts\create_basic_plugin.py korean-context --path plugins --marketplace-path .agents/plugins/marketplace.json --with-skills --with-assets --with-marketplace
```

Expected: plugin 폴더와 marketplace가 생기고 source path가 `./plugins/korean-context`다.

- [ ] **Step 3: 실패하는 실매니페스트 테스트 작성**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plugin manifest", () => {
  it("describes the v0.1 skills-only plugin", () => {
    const manifest = JSON.parse(
      readFileSync("plugins/korean-context/.codex-plugin/plugin.json", "utf8"),
    );
    expect(manifest.name).toBe("korean-context");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.license).toBe("MIT");
    expect(manifest).not.toHaveProperty("mcpServers");
    expect(manifest).not.toHaveProperty("apps");
    expect(manifest).not.toHaveProperty("hooks");
  });
});
```

Expected: scaffold 기본값 때문에 처음에는 FAIL한다.

- [ ] **Step 4: 매니페스트를 공개 값으로 수정**

```json
{
  "name": "korean-context",
  "version": "0.1.0",
  "description": "Write Korean software artifacts with context-appropriate wording, terminology, and register.",
  "author": {
    "name": "김지우",
    "url": "https://github.com/Jigoooo"
  },
  "homepage": "https://github.com/Jigoooo/korean-context",
  "repository": "https://github.com/Jigoooo/korean-context",
  "license": "MIT",
  "keywords": ["korean", "writing", "developer-tools", "localization"],
  "skills": "./skills/",
  "interface": {
    "displayName": "Korean Context",
    "shortDescription": "맥락에 맞는 자연스러운 한국어 산출물",
    "longDescription": "커밋, PR, 리뷰, 문서, UI 등 AI가 만드는 한국어 산출물에 표면·분야·문체에 맞는 표현과 기술 용어를 적용합니다.",
    "developerName": "김지우",
    "category": "Productivity",
    "capabilities": ["Write"],
    "websiteURL": "https://github.com/Jigoooo/korean-context",
    "privacyPolicyURL": "https://github.com/Jigoooo/korean-context/blob/main/PRIVACY.md",
    "termsOfServiceURL": "https://github.com/Jigoooo/korean-context/blob/main/TERMS.md",
    "defaultPrompt": [
      "이 변경사항의 한국어 커밋 메시지를 작성해줘.",
      "이 PR 본문을 자연스러운 한국어로 작성해줘.",
      "이 UI 오류 문구를 사용자에게 자연스럽게 다듬어줘."
    ],
    "brandColor": "#111827",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "logoDark": "./assets/logo-dark.png"
  }
}
```

- [ ] **Step 5: 자산 생성, 검증, 커밋**

```powershell
python C:\Users\PC\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins/korean-context
pnpm vitest run tests/plugin/manifest.test.ts
git add .agents/plugins/marketplace.json plugins/korean-context tests/plugin/manifest.test.ts
git commit -m "feat(plugin): Korean Context 플러그인 골격 추가"
```

### Task 6: 스킬 라우터와 핵심 언어 정책 구현

**Files:**
- Create: `plugins/korean-context/skills/korean-context/SKILL.md`
- Create: `plugins/korean-context/skills/korean-context/agents/openai.yaml`
- Create: `plugins/korean-context/skills/korean-context/references/core-artifact-boundary.md`
- Create: `plugins/korean-context/skills/korean-context/references/core-naturalness.md`
- Create: `plugins/korean-context/skills/korean-context/references/core-translationese.md`
- Create: `plugins/korean-context/skills/korean-context/references/core-terminology.md`
- Create: `plugins/korean-context/skills/korean-context/references/core-register.md`
- Create: `tests/plugin/skill-core.test.ts`

**Interfaces:**
- Consumes: 연구 registry와 평가 100건
- Produces: artifact gate와 다섯 core reference를 선택적으로 읽는 skill

- [ ] **Step 1: 필수 스킬과 실패 테스트**

`skill-creator`와 `superpowers:writing-skills`를 읽는다. 테스트는 name, positive/negative boundary, 다섯 reference 경로, 3,500자 제한, 중첩 경로 부재를 검사한다.

```ts
const skill = readFileSync(
  "plugins/korean-context/skills/korean-context/SKILL.md",
  "utf8",
);
expect(skill).toContain("name: korean-context");
expect(skill).toContain("persistent or publishable Korean artifacts");
expect(skill).toContain("Do not use for ordinary assistant conversation");
expect(skill.length).toBeLessThanOrEqual(3_500);
expect(skill).not.toContain("references/references/");
```

- [ ] **Step 2: compact SKILL.md 작성**

```markdown
---
name: korean-context
description: Use when creating or editing persistent or publishable Korean artifacts such as commits, PRs, issues, reviews, code comments, documentation, UI copy, errors, tests, changelogs, and release notes. Apply context-appropriate Korean wording, terminology, and register while preserving technical meaning and existing style. Do not use for ordinary assistant conversation, progress updates, planning, explanations, questions, or general technical Q&A.
---

# Korean Context

Apply these steps only to the Korean artifact being created or edited.

1. Confirm that the destination is persistent or publishable. If it is ordinary conversation, stop using this skill.
2. Identify the surface and technical domain.
3. Preserve explicit user instructions, existing artifact style, and project conventions in that order.
4. Read `references/core-artifact-boundary.md` and the one relevant surface reference.
5. Read only the domain reference needed for terminology. Use `references/core-terminology.md` when terminology is ambiguous.
6. Apply `references/core-naturalness.md`, `references/core-translationese.md`, and `references/core-register.md` only as needed.
7. Write once, then check meaning, identifiers, numbers, terminology, register, and unnecessary rewriting in the same generation.

Priority:

explicit user instruction > existing artifact style > project convention > surface guidance > domain guidance > Korean Context baseline

Natural Korean is not an error. Do not rewrite text merely to make it look different.
```

`agents/openai.yaml`은 display name, 한국어 short description, brand color `#111827`, `allow_implicit_invocation: true`를 선언한다.

- [ ] **Step 3: 다섯 core reference 작성**

각 파일은 Purpose, Rules, Counterexamples, Same-generation check 섹션을 갖는다.

| 파일 | 반드시 포함할 규칙 |
|---|---|
| artifact boundary | 저장·게시 목적 기준, 혼합 응답은 artifact에만 적용 |
| naturalness | 실무 용례, 정확한 동사, 관료적 표현 과용 금지, 좋은 문장 보존 |
| translationese | 기계적 `의`, `~에 대한`, 영어식 대명사·관계절·명사열·수동태는 맥락 경고 |
| terminology | preferred/accepted/contextual/avoid, 식별자·API·약어 보호, 전역 치환 금지 |
| register | 사용자·기존 문서·프로젝트 우선, 문체 혼용 금지 |

금지 규칙에는 예외를 함께 적고 `견주다→비교하다`, `무효화를 수행한다→무효화한다`, `fallback→후퇴 경로`를 반례로 사용한다.

- [ ] **Step 4: 스킬 검증과 커밋**

```powershell
python C:\Users\PC\.codex\skills\.system\skill-creator\scripts\quick_validate.py plugins/korean-context/skills/korean-context
pnpm vitest run tests/plugin/skill-core.test.ts
git add plugins/korean-context/skills/korean-context tests/plugin/skill-core.test.ts
git commit -m "feat(skill): 산출물 경계와 핵심 한국어 정책 구현"
```

### Task 7: 표면·분야 참조 팩 구현

**Files:**
- Create: `plugins/korean-context/skills/korean-context/references/surface-commit.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-pr.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-issue.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-review.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-comment.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-docs.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-ui.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-error.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-test.md`
- Create: `plugins/korean-context/skills/korean-context/references/surface-release.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-software.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-frontend.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-backend.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-infra.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-security-common.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-security-appsec.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-security-vulnerability.md`
- Create: `plugins/korean-context/skills/korean-context/references/domain-security-pentest-redteam.md`
- Create: `tests/plugin/reference-packs.test.ts`

**Interfaces:**
- Consumes: core references, research registry, 100 eval cases
- Produces: surface 10개와 domain 8개의 얕은 references

- [ ] **Step 1: 실패하는 완전성 테스트**

```ts
const expectedReferenceNames = [
  "surface-commit.md", "surface-pr.md", "surface-issue.md", "surface-review.md",
  "surface-comment.md", "surface-docs.md", "surface-ui.md", "surface-error.md",
  "surface-test.md", "surface-release.md", "domain-software.md",
  "domain-frontend.md", "domain-backend.md", "domain-infra.md",
  "domain-security-common.md", "domain-security-appsec.md",
  "domain-security-vulnerability.md", "domain-security-pentest-redteam.md",
];

it.each(expectedReferenceNames)("%s has the required contract", (name) => {
  const content = readFileSync(`${root}/${name}`, "utf8");
  expect(content).toContain("## Audience");
  expect(content).toContain("## Default register");
  expect(content).toContain("## Rules");
  expect(content).toContain("## Avoid");
  expect(content).toContain("## Examples");
  expect(content.length).toBeLessThanOrEqual(6_000);
});
```

- [ ] **Step 2: 표면 팩 작성**

| 표면 | 기본 문체 | 핵심 요구사항 |
|---|---|---|
| commit | phrase | repo convention 우선, 제목 간결, 실제 변경 동사 |
| PR | 합니다체 | 문제·변경·검증 분리, 과장 금지 |
| issue | 합니다체 | 재현 조건·실제·기대 결과 |
| review | 해요체 | 사람 대신 코드와 영향 설명 |
| comment | 한다체 | 코드가 하는 일보다 이유·제약 |
| docs | 한다체 | 독자·문서 유형에 맞는 용어 |
| UI | phrase 또는 해요체 | 짧고 행동 중심 |
| error | 해요체 | 원인·영향·다음 행동 |
| test | phrase | 관찰 가능한 동작과 조건 |
| release | 합니다체 | 사용자 영향·호환성·migration |

- [ ] **Step 3: 분야 팩 작성**

| 분야 | 포함할 구분 |
|---|---|
| software | 생성/초기화/구성, cache, fallback, API, SDK, runtime |
| frontend | rendering, hydration, focus, autofill, accessibility, state |
| backend | request, response, transaction, idempotency, queue, timeout |
| infra | deployment, rollback, image, container, orchestration, observability |
| security-common | 인증/인가, credential, secret, token, rotate/revoke |
| security-appsec | XSS, CSRF, SSRF, RCE, injection, auth bypass |
| security-vulnerability | 취약점, exploitability, impact, mitigation, remediation |
| security-pentest-redteam | initial access, persistence, privilege escalation, lateral movement, C2, exfiltration |

통용되는 복수 형태는 preferred/accepted/contextual로 구분한다. 공격 절차는 추가하지 않고 표현 선택만 설명한다.

- [ ] **Step 4: coverage 검증과 커밋**

각 reference가 eval의 surface/domain과 연결되고 avoid 예시에 preserve 또는 transfer 반례가 있는지 검사한다.

```powershell
pnpm vitest run tests/plugin/reference-packs.test.ts tests/eval/corpus.test.ts
git add plugins/korean-context/skills/korean-context/references tests/plugin/reference-packs.test.ts
git commit -m "feat(skill): 한국어 표면·분야 참조 팩 추가"
```

### Task 8: 문서, 법적 고지, 검증기, CI 완성

**Files:**
- Create: `src/plugin/schema.ts`
- Create: `src/plugin/validate-cli.ts`
- Create: `tests/plugin/validator.test.ts`
- Create: `tests/fixtures/plugin-missing-logo/.codex-plugin/plugin.json`
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `PRIVACY.md`
- Create: `TERMS.md`
- Create: `CHANGELOG.md`
- Create: `docs/architecture.md`
- Create: `docs/support-matrix.md`
- Create: `docs/releases/v0.1.0.md`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: 완성된 plugin과 설계의 공개 약속
- Produces: `validatePlugin(root): ValidationResult`, 공개 README, 3개 OS CI, release note

- [ ] **Step 1: 실패하는 plugin validator 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { validatePlugin } from "../../src/plugin/schema.js";

describe("plugin validator", () => {
  it("accepts the repository plugin", async () => {
    const result = await validatePlugin("plugins/korean-context");
    expect(result.errors).toEqual([]);
  });

  it("rejects a missing logo", async () => {
    const result = await validatePlugin("tests/fixtures/plugin-missing-logo");
    expect(result.errors).toContain(
      "interface.logo does not resolve inside the plugin",
    );
  });
});
```

Expected: validator 모듈이 없어 FAIL한다.

- [ ] **Step 2: plugin·marketplace validator 구현**

다음을 검사한다.

- plugin name과 폴더 이름 일치
- strict SemVer
- author.name과 필수 interface 필드
- HTTPS URL
- plugin root 밖으로 나가지 않는 skills·asset 경로
- 선언한 파일 존재
- MCP/apps/hooks 필드 부재
- marketplace source `./plugins/korean-context`
- installation `AVAILABLE`, authentication `ON_INSTALL`, category `Productivity`
- 미완성 placeholder 부재

- [ ] **Step 3: README와 정책 문서 작성**

README 첫 화면:

```markdown
# Korean Context

Natural Korean for AI-generated artifacts.

Korean Context helps Codex write Korean commits, PRs, reviews, documentation,
UI copy, errors, tests, and release notes with context-appropriate wording,
terminology, and register.

> v0.1 is a Codex-first prerelease. Explicit invocation is the most reliable
> path; implicit activation remains beta.
```

README는 What it changes, What it does not change, Install from GitHub, Usage, Examples, Privacy, Support matrix, Development 순서다. `PRIVACY.md`는 수집·업로드·백그라운드 모델·runtime network가 없음을 명시한다. `TERMS.md`는 prerelease, 무보증, 사용자 검토 책임을 적는다. `SECURITY.md`는 GitHub private vulnerability reporting을 활성화한 뒤 그 경로를 안내한다.

- [ ] **Step 4: 3개 OS CI 작성**

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.22.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
```

- [ ] **Step 5: 정적 검증과 커밋**

```powershell
pnpm check
python C:\Users\PC\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins/korean-context
python C:\Users\PC\.codex\skills\.system\skill-creator\scripts\quick_validate.py plugins/korean-context/skills/korean-context
git diff --check
git add src/plugin tests/plugin README.md CONTRIBUTING.md SECURITY.md PRIVACY.md TERMS.md CHANGELOG.md docs/architecture.md docs/support-matrix.md docs/releases/v0.1.0.md .github/workflows/ci.yml
git commit -m "docs(release): v0.1 공개 문서와 CI 구성"
```

Expected: 모든 검증이 PASS하고 범위 밖 지원 주장이 없다.

### Task 9: 로컬 설치 수명주기 검증

**Files:**
- Create: `evals/results/v0.1/install-lifecycle.json`
- Modify temporarily then restore: `plugins/korean-context/.codex-plugin/plugin.json`

**Interfaces:**
- Consumes: repo marketplace, Codex CLI 0.147+
- Produces: marketplace 등록, 설치, 재설치, cachebuster 갱신, 제거, 최종 재설치의 readback

- [ ] **Step 1: 기존 Codex 상태 스냅샷**

```powershell
codex plugin marketplace list --json
codex plugin list --available --json
```

Korean Context와 같은 이름의 기존 항목을 확인하고 다른 항목은 변경하지 않는다.

- [ ] **Step 2: 저장소 marketplace 등록**

```powershell
codex plugin marketplace add C:\workspace\korean-context --json
codex plugin marketplace list --json
```

Expected: `personal`과 repository absolute path가 readback에 나타난다.

- [ ] **Step 3: 설치와 동일 소스 재설치**

```powershell
codex plugin add korean-context@personal --json
codex plugin list --json
codex plugin add korean-context@personal --json
```

Expected: 설치 목록에 Korean Context가 있고 두 번째 실행이 다른 설정을 손상하지 않는다.

- [ ] **Step 4: cachebuster 갱신**

```powershell
python C:\Users\PC\.codex\skills\.system\plugin-creator\scripts\update_plugin_cachebuster.py plugins/korean-context
codex plugin add korean-context@personal --json
codex plugin list --json
```

Expected: version이 `0.1.0+codex.local-<UTC timestamp>` 형식 하나만 갖는다.

- [ ] **Step 5: 제거와 최종 재설치**

```powershell
codex plugin remove korean-context@personal --json
codex plugin list --json
codex plugin add korean-context@personal --json
codex plugin list --json
```

Expected: 제거 후 사라지고 재설치 후 나타난다. 다른 plugin/marketplace 목록은 Step 1과 같다.

- [ ] **Step 6: release version 복원과 결과 커밋**

plugin version을 `0.1.0`으로 복원해 다시 설치한다. 각 command, exit code, before/after 항목 수, target version을 기록하되 전체 사용자 설정은 저장하지 않는다.

```powershell
pnpm plugin:validate
git diff --check
git add plugins/korean-context/.codex-plugin/plugin.json evals/results/v0.1/install-lifecycle.json
git commit -m "test(plugin): Codex 설치 수명주기 검증"
```

### Task 10: explicit·implicit Codex 평가와 release gate

**Files:**
- Create: `evals/results/v0.1/explicit/runs.jsonl`
- Create: `evals/results/v0.1/explicit/scores.jsonl`
- Create: `evals/results/v0.1/implicit/runs.jsonl`
- Create: `evals/results/v0.1/implicit/scores.jsonl`
- Create: `evals/results/v0.1/summary.md`
- Modify only when a failure proves it necessary: relevant skill/reference/regression case

**Interfaces:**
- Consumes: baseline 30건, installed plugin, runner, rubric
- Produces: explicit 30건, implicit 30건, 수동 score 60건, calculated release gate

- [ ] **Step 1: explicit 세트 수행**

```powershell
pnpm eval:run -- --mode explicit --live-only
```

Expected: 30개가 새 ephemeral Codex 실행으로 완료되고 `$korean-context` prompt와 result가 저장된다.

- [ ] **Step 2: implicit 세트 수행**

```powershell
pnpm eval:run -- --mode implicit --live-only
```

Expected: 30개가 skill 이름을 언급하지 않은 prompt로 완료된다.

- [ ] **Step 3: rubric에 따라 직접 채점**

보호 토큰과 기술 의미를 먼저 확인한 뒤 다섯 0-2 점수와 boolean 판정을 기록한다. 취향 차이만으로 실패 처리하지 않는다. baseline 대비 개선은 같은 case ID의 원문 출력을 비교한다.

- [ ] **Step 4: release gate 계산**

```powershell
pnpm eval:score -- --release v0.1
```

Expected: technical corruption 0, severe terminology error 0, boundary violation 0, preserve unnecessary rewrite 1 이하, repair improved 9/10 이상, transfer 3/3, artifact 평균 8.5/10 이상, 모든 실행 exit code 0.

- [ ] **Step 5: 실패가 있으면 regression부터 추가하고 최소 수정**

실패 case의 expected/forbidden/protected 조건을 보강하고 가장 좁은 core/surface/domain reference만 수정한다. boundary 실패는 SKILL description과 artifact gate를 먼저 수정한다. cachebuster 갱신·재설치 뒤 영향받은 case와 live set 전체를 다시 수행한다. 별도 LLM judge와 multi-pass rewrite는 추가하지 않는다.

- [ ] **Step 6: release candidate 검증과 커밋**

```powershell
pnpm check
python C:\Users\PC\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins/korean-context
python C:\Users\PC\.codex\skills\.system\skill-creator\scripts\quick_validate.py plugins/korean-context/skills/korean-context
git diff --check
git status --short
git add evals/results/v0.1 plugins/korean-context/skills evals/cases
git commit -m "test(eval): Codex v0.1 품질 게이트 통과"
```

Expected: gate PASS, 민감 정보 없음, 의도하지 않은 변경 없음.

### Task 11: GitHub 공개 저장소와 v0.1.0 프리릴리스 배포

**Files:**
- Modify if final data changed: `README.md`
- Modify: `docs/support-matrix.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/releases/v0.1.0.md`

**Interfaces:**
- Consumes: green main, GitHub account `Jigoooo`, release note
- Produces: public `Jigoooo/korean-context`, green remote CI, annotated `v0.1.0`, GitHub prerelease

- [ ] **Step 1: 원격 충돌과 인증 재확인**

```powershell
gh auth status
gh repo view Jigoooo/korean-context
git status --short --branch
git log --oneline --decorate -10
```

Expected: GitHub auth는 Jigoooo, remote repository는 아직 없고 worktree는 clean이다. repository가 이미 있으면 owner·default branch·content를 읽고 덮어쓰지 않는다.

- [ ] **Step 2: 최종 문서 수치 갱신과 커밋**

support matrix에 실제 Codex CLI version, 검사 날짜, explicit/implicit 상태, limitation을 기록한다. release note에는 실제 평균과 failure 0건 근거를 넣는다.

```powershell
git add README.md docs/support-matrix.md CHANGELOG.md docs/releases/v0.1.0.md
git commit -m "docs(release): v0.1.0 검증 결과 확정"
```

- [ ] **Step 3: 공개 repository 생성과 main push**

```powershell
gh repo create Jigoooo/korean-context --public --source . --remote origin --description "Context-aware Korean writing for AI-generated software artifacts"
git push -u origin main
```

Expected: `https://github.com/Jigoooo/korean-context`가 public이고 remote main은 local HEAD와 같다.

- [ ] **Step 4: remote CI 확인**

```powershell
gh run list --repo Jigoooo/korean-context --limit 5
gh run watch --repo Jigoooo/korean-context --exit-status
```

Expected: Windows, macOS, Linux check가 모두 성공한다. 실패하면 tag를 만들지 않고 원인을 수정한다.

- [ ] **Step 5: security와 repository metadata 설정**

GitHub private vulnerability reporting을 활성화하고 topics `korean`, `codex`, `plugin`, `developer-tools`, `writing`을 설정한다. README와 SECURITY 링크를 readback한다.

```powershell
gh api --method PUT repos/Jigoooo/korean-context/private-vulnerability-reporting
gh repo edit Jigoooo/korean-context --add-topic korean --add-topic codex --add-topic plugin --add-topic developer-tools --add-topic writing
```

- [ ] **Step 6: tag와 GitHub prerelease 생성**

```powershell
git tag -a v0.1.0 -m "Korean Context v0.1.0"
git push origin v0.1.0
gh release create v0.1.0 --repo Jigoooo/korean-context --prerelease --title "Korean Context v0.1.0" --notes-file docs/releases/v0.1.0.md
```

Expected: tag가 green main commit을 가리키고 prerelease page가 public이다.

- [ ] **Step 7: 원격 결과 readback**

```powershell
gh api repos/Jigoooo/korean-context --jq "{visibility:.visibility,default_branch:.default_branch,license:.license.spdx_id}"
gh release view v0.1.0 --repo Jigoooo/korean-context
git rev-list --left-right --count main...origin/main
```

Expected: public, main, MIT, prerelease 존재, divergence `0 0`.

### Task 12: OpenAI 공개 플러그인 제출

**Files:**
- Create: `docs/plugin-submission.md`
- Modify only if public URLs need correction: `README.md`

**Interfaces:**
- Consumes: GitHub prerelease, public URLs, logo, plugin evaluation 60건
- Produces: complete submission materials, 가능하면 OpenAI Platform receipt와 review status

- [ ] **Step 1: 제출 자료 문서 작성**

`docs/plugin-submission.md`에 다음 값을 기록한다.

- Name: Korean Context
- Category: Productivity
- Website: `https://github.com/Jigoooo/korean-context`
- Support: `https://github.com/Jigoooo/korean-context/issues`
- Privacy: `https://github.com/Jigoooo/korean-context/blob/main/PRIVACY.md`
- Terms: `https://github.com/Jigoooo/korean-context/blob/main/TERMS.md`
- Availability: South Korea를 포함한 directory 지원 지역
- Release: `v0.1.0`
- Positive tests: repair-001, generation-001, review 1개, ui 1개, security-appsec 1개
- Negative tests: boundary-001, 일반 계획 1개, 일반 기술 Q&A 1개
- Known limitation: explicit invocation is most reliable; implicit activation is beta

- [ ] **Step 2: 제출 전 URL과 권한 확인**

브라우저에서 제출 조직의 Apps Management: Write, verified individual 또는 business developer identity, public website/support/privacy/terms URL, skills-only submission type을 확인한다. 권한이나 신원 검증이 없으면 제출하지 않고 필요한 사용자 조치와 화면 상태를 기록한다.

- [ ] **Step 3: skills-only submission form 작성**

최종 plugin bundle, 세 logo asset, descriptions, starter prompts, positive 5개·negative 3개 tests, regions, release note를 업로드한다. MCP 필드는 비워 두고 존재하지 않는 server나 authentication을 선언하지 않는다.

- [ ] **Step 4: 최종 preview 검토**

preview의 name, developer, logo, descriptions, URLs, v0.1 limitation, privacy wording을 `plugin.json`과 대조한다. 사용자 데이터 수집이나 external service 사용이 잘못 표시되면 제출하지 않고 수정한다.

- [ ] **Step 5: 제출과 상태 기록**

제출이 가능하면 제출하고 receipt ID, submitted time, status를 문서화한다. review pending은 `submitted`로 표현한다. 외부 review가 즉시 끝나지 않아도 GitHub prerelease는 completed 상태로 유지한다.

- [ ] **Step 6: 제출 상태 커밋과 push**

```powershell
git add docs/plugin-submission.md README.md
git commit -m "docs(plugin): 공개 디렉터리 제출 상태 기록"
git push origin main
```

- [ ] **Step 7: 최종 완료 검증**

```powershell
pnpm check
gh run watch --repo Jigoooo/korean-context --exit-status
git status --short --branch
git rev-list --left-right --count main...origin/main
```

Expected: local/remote clean, CI green, divergence `0 0`, GitHub prerelease public, public directory는 `submitted` 또는 외부 차단 사유가 문서화돼 있다.

---

## Release Evidence Checklist

- [ ] `pnpm check` 최종 출력
- [ ] 공식 plugin validator 최종 출력
- [ ] 공식 skill validator 최종 출력
- [ ] 100개 평가 분포 출력
- [ ] baseline/explicit/implicit 30개씩의 실행 메타데이터
- [ ] 점수 집계와 모든 v0.1 gate
- [ ] marketplace install/update/remove/reinstall readback
- [ ] GitHub Actions 3개 OS 성공 URL
- [ ] `v0.1.0` tag와 prerelease URL
- [ ] OpenAI submission receipt 또는 정확한 외부 차단 상태
