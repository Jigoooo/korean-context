---
name: korean-context
description: Use when creating or editing persistent or publishable Korean artifacts such as commits, PRs, issues, reviews, code comments, documentation, UI copy, errors, tests, changelogs, and release notes. Apply context-appropriate Korean wording, terminology, and register while preserving technical meaning and existing style. Do not use for ordinary assistant conversation, progress updates, planning, explanations, questions, or general technical Q&A.
---

# Korean Context

## Required workspace preflight

Run this before choosing references or drafting when the request contains `<workspace>`, asks for project conventions, or needs a project-specific fact or procedure not fully given:

1. Treat the process working directory as the workspace root, not a literal `<workspace>` directory.
2. Search read-only for vocabulary, terminology, glossary, wording, `용어`, `어휘`, or SSOT sources.
3. For a missing fact or procedure, also search relevant project docs or source.
4. Read the smallest authoritative match, extract only the needed facts and terms, then draft.

Output-only requests still require this preflight.

1. If the destination is ordinary conversation, progress, planning, explanation, a question, or technical Q&A, answer only from the prompt and established general knowledge; preserve technical conditions, omit workspace, project, and session provenance unless requested, and stop. 스킬 이름, 활성화 여부, 적용하지 않은 이유를 언급하지 않는다.
2. Identify the surface and technical domain.
3. Preserve explicit user instructions, existing artifact style, and project conventions in that order. Apply any terminology or style found by the required workspace preflight.
4. Read `references/core-artifact-boundary.md` and the relevant `references/surface-*.md` file.
5. Read only the needed `references/domain-*.md` file. Read `references/core-terminology.md` whenever the workspace preflight runs or terminology is ambiguous.
6. Apply `references/core-naturalness.md`, `references/core-translationese.md`, and `references/core-register.md` as needed.
7. Write once, then check meaning, identifiers, numbers, terminology, register, invented details, and unnecessary rewriting in the same generation.

Priority:

explicit user instruction > existing artifact style > project convention > surface guidance > domain guidance > Korean Context baseline

Natural Korean is not an error. Do not rewrite text merely to make it look different.

When text is already natural and accurate, return it unchanged. When the prompt contains enough artifact content, return the artifact directly without discussing the workspace. Never invent missing facts, test results, reproduction conditions, or project conventions.

## Reference routing

- Git work: `surface-commit.md`, `surface-pr.md`, `surface-issue.md`, `surface-review.md`
- Source and docs: `surface-comment.md`, `surface-docs.md`
- Product text: `surface-ui.md`, `surface-error.md`
- Quality and delivery: `surface-test.md`, `surface-release.md`
- Software domains: `domain-software.md`, `domain-frontend.md`, `domain-backend.md`, `domain-infra.md`
- Security domains: `domain-security-common.md`, `domain-security-appsec.md`, `domain-security-vulnerability.md`, `domain-security-pentest-redteam.md`

Read one surface reference and, when specialist terminology matters, one domain reference. Do not load every reference.
