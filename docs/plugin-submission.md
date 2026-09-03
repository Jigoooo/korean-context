# OpenAI plugin submission: Korean Context v0.1.0

이 문서는 OpenAI Platform의 public plugin submission form에 입력할 v0.1.0 자료다.

## Submission type

- Type: Skills only
- Version: 0.1.0
- Category: Productivity
- Availability: OpenAI가 지원하는 모든 국가 및 지역

## Info

- Plugin name: Korean Context
- Developer name: 김지우
- Short description: 맥락에 맞는 자연스러운 한국어 산출물
- Long description: 커밋, PR, 리뷰, 문서, UI 등 AI가 만드는 한국어 산출물에 표면, 분야, 문체에 맞는 표현과 기술 용어를 적용합니다. 기술적 의미와 프로젝트의 기존 스타일을 보존하며 일반 대화에는 개입하지 않습니다.
- Website: https://github.com/Jigoooo/korean-context
- Support: https://github.com/Jigoooo/korean-context/issues
- Privacy policy: https://github.com/Jigoooo/korean-context/blob/main/PRIVACY.md
- Terms of service: https://github.com/Jigoooo/korean-context/blob/main/TERMS.md
- Logo: `plugins/korean-context/assets/logo.png`

## Skill bundle

- Skill: `plugins/korean-context/skills/korean-context`
- Entrypoint: `plugins/korean-context/skills/korean-context/SKILL.md`
- MCP server: 없음
- Runtime network: 사용하지 않음
- Authentication: 없음
- Data collection, analytics, telemetry: 없음

## Starter prompts

1. 이 변경사항의 한국어 커밋 메시지를 작성해줘.
2. 이 PR 본문을 자연스러운 한국어로 작성해줘.
3. 이 UI 오류 문구를 사용자에게 자연스럽게 다듬어줘.

## Positive test cases

1. Prompt: `Use $korean-context to write a Korean commit message for fixing duplicate requests when the retry button is clicked.`
   Expected: Angular 스타일의 간결한 한국어 커밋 메시지를 만들고, 중복 요청을 재시도 버튼 클릭과 정확히 연결한다.
2. Prompt: `Use $korean-context to write a Korean PR body for adding AbortController cancellation to search requests. Include summary and tests, but do not invent test results.`
   Expected: 요약과 테스트 섹션을 자연스러운 한국어로 구성하며 제공되지 않은 테스트 결과를 만들지 않는다.
3. Prompt: `Use $korean-context to rewrite this UI error: "인증 토큰이 유효하지 않음으로 로그인이 실패되었습니다."`
   Expected: 기술적 의미를 보존하면서 사용자에게 자연스러운 오류 문구로 다듬는다.
4. Prompt: `Use $korean-context to write a Korean code review comment explaining that this query creates an N+1 problem.`
   Expected: N+1 용어를 그대로 보존하고 문제와 수정 방향을 공격적이지 않은 리뷰 문체로 설명한다.
5. Prompt: `Use $korean-context to write a Korean vulnerability note for an IDOR that lets one user read another user's invoice. Do not add facts.`
   Expected: IDOR의 의미와 영향을 정확히 표현하고 재현 조건, 계정, 버전 등 제공되지 않은 사실을 추가하지 않는다.

## Negative test cases

1. Prompt: `오늘 서울 날씨 알려줘.`
   Expected: 일반 질문이므로 Korean Context를 활성화하거나 문체를 교정하려 들지 않는다.
2. Prompt: `이 React useEffect가 왜 무한 렌더링을 만드는지 설명해줘.`
   Expected: 일반 기술 설명이므로 플러그인의 한국어 산출물 규칙을 적용하지 않는다.
3. Prompt: `지금 진행 상황을 한 줄로 알려줘.`
   Expected: 대화형 진행 상황 요청이므로 플러그인을 활성화하지 않는다.

## Release notes

Korean Context의 첫 공개 prerelease입니다. 커밋, PR, 이슈, 리뷰, 코드 주석, 문서, UI, 오류, 테스트, 릴리스 노트용 한국어 지침과 소프트웨어 및 보안 분야 용어 지침을 포함합니다. Codex live 30건에서 명시 호출 9.97/10, 암묵 호출 9.87/10을 기록했으며 기술 의미 훼손과 범위 침범은 관찰되지 않았습니다. 명시 호출을 권장하고 암묵 활성화는 beta로 제공합니다.

## Submission checklist

- [x] Public repository and v0.1.0 prerelease
- [x] Production logo
- [x] Public website, support, privacy, and terms URLs
- [x] Final skills-only bundle
- [x] Five positive and three negative test cases
- [x] Local install lifecycle verification
- [x] Ubuntu, macOS, and Windows CI
- [ ] Apps Management: Write permission confirmed in the submitting organization
- [ ] Verified individual or business identity selected
- [ ] Draft created and submitted for OpenAI review

## Evidence

- Evaluation: `evals/results/v0.1/summary.md`
- Install lifecycle: `evals/results/v0.1/install-lifecycle.json`
- Release: https://github.com/Jigoooo/korean-context/releases/tag/v0.1.0
- CI: https://github.com/Jigoooo/korean-context/actions/workflows/ci.yml
