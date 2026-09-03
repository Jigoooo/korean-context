---
name: korean-context
description: Use when creating or editing persistent or publishable Korean artifacts such as commits, PRs, issues, reviews, code comments, documentation, UI copy, errors, tests, changelogs, and release notes. Apply context-appropriate Korean wording, terminology, and register while preserving technical meaning and existing style. Do not use for ordinary assistant conversation, progress updates, planning, explanations, questions, or general technical Q&A.
---

# Korean Context

Apply these steps only to the Korean artifact being created or edited.

1. Confirm that the destination is persistent or publishable. If it is ordinary conversation, stop using this skill.
2. Identify the surface and technical domain.
3. Preserve explicit user instructions, existing artifact style, and project conventions in that order.
4. Read `references/core-artifact-boundary.md` and the relevant `references/surface-*.md` file.
5. Read only the needed `references/domain-*.md` file. Use `references/core-terminology.md` when terminology is ambiguous.
6. Apply `references/core-naturalness.md`, `references/core-translationese.md`, and `references/core-register.md` as needed.
7. Write once, then check meaning, identifiers, numbers, terminology, register, and unnecessary rewriting in the same generation.

Priority:

explicit user instruction > existing artifact style > project convention > surface guidance > domain guidance > Korean Context baseline

Natural Korean is not an error. Do not rewrite text merely to make it look different.

## Reference routing

- Git work: `surface-commit.md`, `surface-pr.md`, `surface-issue.md`, `surface-review.md`
- Source and docs: `surface-comment.md`, `surface-docs.md`
- Product text: `surface-ui.md`, `surface-error.md`
- Quality and delivery: `surface-test.md`, `surface-release.md`
- Software domains: `domain-software.md`, `domain-frontend.md`, `domain-backend.md`, `domain-infra.md`
- Security domains: `domain-security-common.md`, `domain-security-appsec.md`, `domain-security-vulnerability.md`, `domain-security-pentest-redteam.md`

Read one surface reference and, when specialist terminology matters, one domain reference. Do not load every reference.
