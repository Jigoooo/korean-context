# Changelog

## [Unreleased]

## [0.2.0] - 2026-09-05

### Added

- 익명화·합성 v0.2 평가 사례 60개와 20개 반복 사례
- mode-blind 수동 점수, deterministic hard failure와 release gate
- 전체 v0.1 regression 100개와 메모리·MCP 격리 실행 기록

### Changed

- workspace 용어 원본을 먼저 확인하고 사용자 지시와 프로젝트 용어를 우선하도록 강화
- 영문 코드 식별자, 기술 대상, 버전, 명령어와 숫자 보존 규칙 강화
- 재연결과 생성처럼 다른 기술 동작을 구분하고 산출물별 문체·형식을 재검증

### Fixed

- 일반 기술 Q&A에 스킬 이름이나 활성화 여부를 덧붙이던 경계 문제
- 사용자가 제공한 짧은 이슈 항목 대신 작업공간 설명, placeholder 또는 빈 항목을 반환하던 문제
- 한국어 어미 뒤에 무관한 라틴·그리스·키릴 문자 조각이 붙는 문제
- `node`, `canvas`, `sidebar`, `context` 같은 입력 표기를 임의로 음역하던 문제

### Known limitations

- Codex explicit invocation만 v0.2에서 검증했습니다.
- 수동 rubric과 고정 공개 표본의 결과이며 모델과 실행 환경에 따라 달라질 수 있습니다.
- 비공개 Offen model audit, Claude Code, v0.2 implicit activation과 npm 배포는 검증하지 않았습니다.

## [0.1.0] - 2026-09-03

### Added

- Codex skills-only plugin과 repo marketplace
- artifact boundary와 자연스러움·번역투·용어·문체 core policy
- 표면 10개와 software/security domain reference 8개
- 평가 case 100개와 baseline/explicit/implicit live 30건
- plugin·skill·평가 validator와 3개 OS CI

### Known limitations

- Codex만 검증했습니다.
- explicit invocation이 가장 안정적이며 implicit activation은 beta입니다.
- 강한 baseline보다 명확히 나은 repair 사례는 live 10건 중 4건입니다.
