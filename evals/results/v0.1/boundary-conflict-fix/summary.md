# Boundary and conflict regression verification

검사일: 2026-09-03

Codex: `codex-cli 0.147.0`

Model: `gpt-5.6-sol`

## Reproduction

- `boundary-003` explicit 실행이 일반 TypeScript 답변 뒤에 스킬 비적용 이유를 덧붙였다.
- `conflict-003` explicit/implicit 실행이 요청한 짧은 bullet 대신 작업공간에 템플릿이 없다는 설명과 추가 자료 요청을 반환했다.

## First fix

- 일반 대화에서 스킬 이름, 활성화 여부와 비적용 이유를 언급하지 않도록 진입 규칙과 boundary reference를 보강했다.
- 사용자가 제공한 프로젝트 형식과 사실을 충분한 맥락으로 취급하도록 issue reference를 보강했다.
- `boundary-003`: explicit 3/3, implicit 3/3에서 스킬 메타 설명이 없었다.
- `conflict-003`: 6/6에서 작업공간 설명과 추가 자료 요청이 사라졌지만, 1건은 placeholder를, 1건은 값이 없는 colon을 반환했다.
- 기존 repair, generation, preserve 대조군 4/4는 기대 동작을 유지했다.

## Second fix

- 단일 항목은 `- <항목>: <알려진 사실>` 형태로 작성하도록 명시했다.
- placeholder, 대괄호 안내와 값이 없는 colon을 금지했다.

## Final result

- `conflict-003`: explicit 3/3, implicit 3/3 모두 `- 재현 조건: 로그인 실패`를 반환했다.
- `boundary-003`: explicit 1/1, implicit 1/1에서 일반 기술 답변만 반환했다.
- 작업공간 설명, 추가 자료 요청, placeholder, 빈 항목과 스킬 메타 설명은 0건이었다.

`runs.jsonl`은 최종 수정본의 실제 8회 출력을 보존한다. 실행 성공과 별도로 모든 출력 내용을 수동 검토했다.
