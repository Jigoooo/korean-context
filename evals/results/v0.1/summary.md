# v0.1 Codex evaluation

검사일: 2026-09-03

Codex: `codex-cli 0.147.0`

Model: `gpt-5.6-sol`

Live set: 고정 30건

| Mode | Completed | Average | Technical corruption | Severe terminology error | Boundary violation | Unnecessary rewrite |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | 30/30 | 9.33/10 | 0 | 0 | 0 | 4 |
| Explicit | 30/30 | 9.97/10 | 0 | 0 | 0 | 0 |
| Implicit | 30/30 | 9.87/10 | 0 | 0 | 0 | 1 |

## Observed gains

- repair 10건은 explicit과 implicit 모두 어색한 입력을 자연스러운 산출물로 바꿨다.
- 강한 baseline보다 명확히 나아진 repair는 4/10이었다.
- 첫 실행에서 나타난 preserve 과수정과 없는 조건 생성 문제를 규칙에 반영했다.
- 보강 후 explicit preserve는 5/5 원문을 유지했고 implicit은 4/5를 유지했다.
- 기술 의미 훼손, 심각한 용어 오역, 일반 대화 문체 오염은 관찰되지 않았다.

## Remaining limitation

Implicit `conflict-003`은 없는 로그인 조건을 만들지는 않았지만 요청한 짧은 bullet 대신 작업공간에 정보가 없다는 설명을 반환했다. 명시적 호출은 같은 케이스에서 제공된 사실만 사용해 `- 재현 조건: 로그인 실패`를 반환했다.

평균은 이 저장소의 rubric에 따른 수동 평가다. 표본이 작고 모델 출력에는 변동성이 있으므로 일반적인 품질 보증으로 해석하지 않는다. `explicit-pre-fix`와 `implicit-pre-fix`에는 규칙 보강 전 결과를 보존했다.
