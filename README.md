# Korean Context

Natural Korean for AI-generated artifacts.

Korean Context helps Codex write Korean commits, PRs, reviews, documentation, UI copy, errors, tests, and release notes with context-appropriate wording, terminology, and register.

> v0.1 is a Codex-first prerelease. Explicit invocation is the most reliable path; implicit activation remains beta.

## What it changes

- 어색한 명사화와 기계적인 번역투를 줄입니다.
- 산출물 종류와 독자에 맞는 해요체·합니다체·한다체·명사구를 선택합니다.
- 프로젝트의 기존 문체와 기술 용어를 기본 규칙보다 우선합니다.
- 소프트웨어와 주요 AppSec·취약점·pentest/red-team 용어를 구분합니다.

## What it does not change

일반 대화, 진행 상황, 계획, 설명, 질문과 일반 기술 Q&A의 말투는 바꾸지 않습니다. 자동 학습, 산출물 업로드, 백그라운드 모델, MCP 서버와 runtime network도 사용하지 않습니다.

## Install from GitHub

```powershell
codex plugin marketplace add Jigoooo/korean-context --ref v0.1.0
codex plugin add korean-context@personal
```

공개 디렉터리 심사가 끝난 뒤에는 Codex Plugins 화면에서도 설치할 수 있습니다.

## Usage

가장 안정적인 방법은 스킬을 명시하는 것입니다.

```text
Use $korean-context to write a Korean PR body for this change.
```

자연어로 커밋, PR, 리뷰, 문서, UI 문구 작성을 요청하면 암시적으로 활성화될 수도 있습니다.

## Measured v0.1 result

2026-09-03, `codex-cli 0.147.0`, `gpt-5.6-sol`, 고정된 live 30건 기준:

| Mode     |  Runs | Average | Technical corruption | Boundary violation | Unnecessary rewrite |
| -------- | ----: | ------: | -------------------: | -----------------: | ------------------: |
| Explicit | 30/30 | 9.97/10 |                    0 |                  0 |                   0 |
| Implicit | 30/30 | 9.87/10 |                    0 |                  0 |                   1 |

강한 baseline보다 명확히 좋아진 repair 사례는 10건 중 4건이었습니다. 결과는 작은 고정 표본에 대한 수동 rubric 평가이며 모델 변동성을 포함합니다. 자세한 원문 결과는 `evals/results/v0.1`에 있습니다.

## Privacy

언어 정책은 설치된 Markdown reference로만 동작합니다. 자세한 내용은 [PRIVACY.md](PRIVACY.md)를 참고하세요.

## Support

현재 검증된 대상은 Codex CLI 0.147.0과 Codex의 명시적·암시적 스킬 호출입니다. [지원 표](docs/support-matrix.md)와 [알려진 제한](docs/releases/v0.1.0.md)을 확인하세요.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm check
```

연구 근거는 `research/sources.yml`, 평가 코퍼스는 `evals/cases`, plugin source는 `plugins/korean-context`에 있습니다.
