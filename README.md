# Korean Context

Natural Korean for AI-generated artifacts.

Korean Context helps Codex write Korean commits, PRs, reviews, documentation, UI copy, errors, tests, and release notes with context-appropriate wording, terminology, and register.

> v0.2 is a Codex-first prerelease validated with explicit invocation. Implicit activation remains beta based on v0.1 evidence.

## Roadmap

Current implementation status, the active milestone, and handoff instructions for future sessions are maintained in [ROADMAP.md](ROADMAP.md).

## What it changes

- 어색한 명사화와 기계적인 번역투를 줄입니다.
- 산출물 종류와 독자에 맞는 해요체·합니다체·한다체·명사구를 선택합니다.
- 프로젝트의 기존 문체와 기술 용어를 기본 규칙보다 우선합니다.
- 소프트웨어와 주요 AppSec·취약점·pentest/red-team 용어를 구분합니다.

## What it does not change

일반 대화, 진행 상황, 계획, 설명, 질문과 일반 기술 Q&A의 말투는 바꾸지 않습니다. 자동 학습, 산출물 업로드, 백그라운드 모델, MCP 서버와 runtime network도 사용하지 않습니다.

## Install from GitHub

```powershell
codex plugin marketplace add Jigoooo/korean-context --ref v0.2.0
codex plugin add korean-context@personal
```

## Usage

가장 안정적인 방법은 스킬을 명시하는 것입니다.

```text
Use $korean-context to write a Korean PR body for this change.
```

자연어로 커밋, PR, 리뷰, 문서, UI 문구 작성을 요청하면 암시적으로 활성화될 수도 있습니다.

## Measured v0.2 result

2026-09-05, `codex-cli 0.147.0`, `gpt-5.6-sol`, `xhigh`, 공개 고정 세트의 유효 실행 100건 기준:

| Mode     |    Runs | Average | Hard failure | Protected content | Format | Gold correction |
| -------- | ------: | ------: | -----------: | ----------------: | -----: | --------------: |
| Baseline | 100/100 | 9.76/10 |            4 |               97% |   100% |           63/66 |
| Explicit | 100/100 | 9.87/10 |            0 |              100% |   100% |           66/66 |

쌍별 점수는 explicit이 11건에서 높고, 84건에서 같고, 5건에서 낮았습니다. v0.1 regression도 유효 100/100으로 통과했습니다. 결과는 익명화·합성 고정 표본에 대한 수동 rubric 평가이며 모델 변동성을 포함합니다. 자세한 조건과 제한은 [v0.2 평가 요약](evals/results/v0.2/summary.md)에 있습니다.

### Historical v0.1 result

v0.1의 explicit 30건은 9.97/10, implicit 30건은 9.87/10이었습니다. 자세한 결과는 [v0.1 평가 요약](evals/results/v0.1/summary.md)에 있습니다.

## Privacy

언어 정책은 설치된 Markdown reference로만 동작합니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 참고하세요.

## Support

현재 v0.2에서 검증된 대상은 Codex CLI 0.147.0의 명시적 스킬 호출입니다. [지원 표](docs/support-matrix.md)와 [v0.2 알려진 제한](docs/releases/v0.2.0.md)을 확인하세요.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm check
```

연구 근거는 `research/sources.yml`, 평가 코퍼스는 `evals/cases`, plugin source는 `plugins/korean-context`에 있습니다.
