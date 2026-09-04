# Korean Context evaluation rubric

각 산출물은 다음 다섯 항목을 0-2점으로 평가한다.

## Naturalness

- 2: 해당 표면의 한국 실무자가 자연스럽게 쓸 표현이다.
- 1: 이해되지만 어색하거나 불필요하게 딱딱한 부분이 남아 있다.
- 0: 번역투나 부자연스러운 표현이 핵심 전달을 방해한다.

## Terminology

- 2: 분야와 독자에 맞는 통용 용어를 정확히 쓴다.
- 1: 의미는 맞지만 덜 통용되는 형태나 불필요한 병기가 있다.
- 0: 전문 용어의 의미를 바꾸거나 심각하게 오역한다.

## Meaning preservation

- 2: 사실, 조건, 수치, 식별자와 기술적 의미를 모두 보존한다.
- 1: 핵심은 보존하지만 강도나 조건이 조금 달라졌다.
- 0: 기술적 의미, 사실, 조건 또는 보호 토큰을 훼손했다.

## Surface fit

- 2: 길이, 구조, 문체가 해당 산출물에 맞는다.
- 1: 사용할 수 있지만 길이 또는 문체를 더 다듬어야 한다.
- 0: 다른 종류의 문서처럼 쓰거나 기존 관례를 무시한다.

## Translationese

- 2: 한국어 어순과 직접적인 동사를 자연스럽게 쓴다.
- 1: 기계적 명사화, 피동, 연결 표현이 일부 남아 있다.
- 0: 영어 구조를 단어만 바꿔 옮긴 문장이 지배적이다.

기술적 의미 훼손과 심각한 용어 오역은 총점과 무관한 hard failure다. 이미 자연스러운 문장을 취향 때문에 다시 쓰면 unnecessary rewrite로 기록한다. 일반 대화에 산출물 규칙을 적용하면 boundary violation이다.

## v0.2 boolean 판정

각 v0.2 실행에는 다음 항목을 독립적으로 기록한다. 한 출력에서 여러 항목이 동시에 참일 수 있으며 총점으로 상쇄하지 않는다.

- `technicalMeaningChange`: 입력의 사실, 조건, 동작 방향, 강도 또는 범위를 추가·삭제·변경했다.
- `inventedFact`: 입력과 공개 fixture에 없는 사실, 원인, 조건, 검증 결과 또는 해결책을 만들었다.
- `projectVocabularyViolation`: `projectVocabulary.forbidden` 용어를 사용했거나 프로젝트가 정한 용어를 승인되지 않은 표현으로 바꿨다.
- `protectedContentViolation`: 보호 토큰, 사실, 숫자, 명령어, 식별자 또는 키 이름을 누락하거나 변경했다.
- `formatViolation`: case가 요구한 줄 수, 목록, 표, 커밋 제목 또는 exact-output 형식을 지키지 않았다.
- `boundaryViolation`: 일반 대화나 설명 요청에 산출물 교정 정책을 적용했다.
- `unnecessaryRewrite`: 객관적인 문제가 없는 자연스러운 원문을 취향 차이만으로 실질적으로 바꿨다.
- `improvedOverBaseline`: explicit 출력이 대응하는 baseline보다 하나 이상의 채점 항목을 실질적으로 개선했고 새로운 위반을 만들지 않았다. baseline 점수에는 `false`를 기록한다.

## Gold issue 계산

- `goldIssuesTotal`은 모델 출력을 보기 전에 case별로 선언한 독립적인 어색함 문제 수다.
- 한 문제가 여러 문장에 반복되더라도 같은 원인과 같은 수정으로 해결되면 1건으로 센다.
- `goldIssuesCorrected`는 출력에서 실제로 해결된 선언 문제 수며 `goldIssuesTotal`을 넘을 수 없다.
- 수정 과정에서 hard failure가 생기면 해당 문제를 교정한 것으로 세지 않는다.
- 보존 또는 경계 case처럼 교정 대상이 없으면 두 값을 모두 `0`으로 기록한다.
- 같은 case의 baseline과 explicit, 반복 attempt에는 동일한 `goldIssuesTotal`을 사용한다.

## 블라인드 검토

채점용 worksheet에서는 mode, 플러그인 버전과 실행 순서를 숨기고 무작위 `reviewId`만 노출한다. 채점자는 case의 입력, 보호 조건, 기대 동작과 출력만 보고 다섯 점수, boolean 판정, gold issue 교정 수와 근거를 기록한다. 모든 실행의 1차 채점이 끝난 뒤에만 `reviewId`를 실행 복합 키로 되돌린다.

## 2차 검토

다음 결과는 반드시 다시 검토한다.

- 다섯 항목 중 하나라도 0점 또는 1점인 결과
- boolean 판정이 하나라도 `true`인 결과
- 같은 case의 baseline과 explicit 판정이 다른 결과
- 반복 attempt 사이에서 hard failure 또는 형식 판정이 다른 결과

점수를 바꿀 때는 `notes`에 근거를 남긴다. 이견을 평균으로 숨기지 않으며 LLM 판정만으로 릴리스 결과를 확정하지 않는다.

## v0.2 릴리스 임계값

- explicit hard failure: `0`
- unnecessary rewrite: `5%` 이하
- 형식 준수: `95%` 이상
- gold issue 교정: `90%` 이상
- 반복 실행 hard-failure variance: `0`
- 성공한 v0.1 explicit 회귀 실행: `100`건
