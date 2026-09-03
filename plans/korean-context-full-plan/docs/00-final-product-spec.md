# 00. Final Product Specification

## 1. Name

**Korean Context**

Package/CLI target:

```text
korean-context
```

Primary command:

```bash
npx korean-context@latest
```

## 2. Product problem

AI coding agents frequently produce Korean that is grammatically valid but contextually unnatural.

Common failures:

- dictionary-valid but uncommon vocabulary
- English sentence structure translated into Korean words
- literary verbs in technical prose
- bureaucratic/official-document phrasing
- unnecessary nominalization
- excessive `수행하다`, `진행하다`, `해당`
- technical terminology translated too literally
- English terminology preserved when a standard Korean loanword is more natural
- specialist security terms mistranslated
- inconsistent `요 / 합니다 / 한다`
- UI copy written like technical documentation
- review comments written like formal reports
- natural existing text rewritten merely to appear "human"

Examples:

```text
두 구현을 견주어 본다.
→ 두 구현을 비교한다.

에디터 인스턴스를 세운다.
→ 에디터 인스턴스를 생성한다 / 초기화한다 / 구성한다.
  (actual operation decides)

캐시의 무효화를 수행한다.
→ 캐시를 무효화한다.

fallback을 후퇴 경로로 구성한다.
→ fallback 경로를 구성한다.
```

## 3. Product philosophy

Korean Context does not answer:

> How can this sound less AI-written?

It answers:

> What would a competent Korean practitioner plausibly write in this exact artifact, domain, audience, and register?

## 4. Artifact-only scope

Applied artifacts:

### Git collaboration

- commit subject/body
- PR title/body
- issue title/body
- review comment
- review suggestion

### Source

- code comments
- JSDoc
- docstrings
- TODO/FIXME
- user-visible strings

### Documentation

- README
- Markdown
- ADR
- design docs
- specifications
- API docs
- migration guides

### Product

- buttons
- menus
- labels
- headings
- descriptions
- dialogs
- toasts
- validation
- errors
- empty states
- onboarding copy
- product CLI output

### Test/release

- test names
- test descriptions
- changelogs
- release notes

## 5. Explicit exclusions

Korean Context does not govern:

- normal assistant chat
- progress commentary
- planning conversation
- explanatory answers
- questions to the user
- normal technical Q&A

This boundary must be testable.

## 6. Context axes

Every artifact decision can be modeled as:

```text
Surface × Domain × Register × Terminology × Naturalness
```

plus:

```text
Existing Artifact Style
Project Convention
Explicit User Instruction
```

## 7. Default precedence

```text
User instruction
>
Existing artifact style
>
Project convention
>
Surface
>
Domain
>
Baseline
```

## 8. V1 domains

Generic:

- software
- frontend
- backend
- database
- infrastructure/devops
- AI/ML

Security:

- common security
- AppSec
- vulnerability
- pentest
- red team
- blue team/SOC
- DFIR
- malware/reverse engineering
- cloud/IAM

## 9. Register defaults

Defaults for new artifacts only:

| Surface | Default |
|---|---|
| Commit subject | phrase/no-ending |
| Commit body | concise declarative or repo convention |
| PR title | phrase/no-ending |
| PR body | 합니다체 |
| Issue | 합니다체 |
| Code review | professional 해요체 |
| Source comment/JSDoc | 한다체 |
| Technical README/ADR/spec | 한다체 |
| UI description/error | 해요체 when sentence-like |
| Button/menu/label | no-ending |
| Changelog | phrase style |
| Release note | 합니다체 or product convention |

Existing style overrides defaults.

## 10. Technical terminology principle

Do not model terminology as a global one-to-one dictionary.

Each form can be:

- preferred
- accepted
- contextual
- avoid

Example:

```yaml
concept: lateral-movement
domain: security
forms:
  "횡적 이동": preferred
  "Lateral Movement": accepted
  "측면 이동": contextual
  "측방 움직임": avoid
```

## 11. Runtime constraints

V1 default path:

```text
extra model calls: 0
runtime network: 0
background process: 0
automatic learning DB: 0
embedding lookup: 0
mandatory hooks: 0
```

## 12. Distribution target

One command.

Agent multi-select.

Global/project selection.

Strongest safe native integration automatically.

No ordinary user should need to know:

- Agent Skill paths
- plugin manifest details
- persistent-rule files
- config formats
- hook systems
