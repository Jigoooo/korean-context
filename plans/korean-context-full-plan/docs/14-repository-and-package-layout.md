# 14. Repository and Package Layout

## Proposed final repository

```text
korean-context/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
│
├── skills/
│   └── korean-context/
│       ├── SKILL.md
│       └── references/
│           ├── core-artifact-boundary.md
│           ├── core-naturalness.md
│           ├── core-translationese.md
│           ├── core-terminology.md
│           ├── core-register.md
│           ├── surface-commit.md
│           ├── surface-pr.md
│           ├── surface-issue.md
│           ├── surface-review.md
│           ├── surface-comment.md
│           ├── surface-docs.md
│           ├── surface-ui.md
│           ├── surface-error.md
│           ├── surface-test.md
│           ├── surface-release.md
│           ├── domain-software.md
│           ├── domain-frontend.md
│           ├── domain-backend.md
│           ├── domain-database.md
│           ├── domain-infra.md
│           ├── domain-ai-ml.md
│           ├── domain-security-common.md
│           ├── domain-security-appsec.md
│           ├── domain-security-vulnerability.md
│           ├── domain-security-pentest.md
│           ├── domain-security-redteam.md
│           ├── domain-security-blueteam.md
│           ├── domain-security-dfir.md
│           ├── domain-security-malware.md
│           └── domain-security-cloud.md
│
├── src/
│   ├── cli/
│   ├── registry/
│   ├── detection/
│   ├── adapters/
│   ├── install/
│   ├── managed-block/
│   ├── verification/
│   └── reporting/
│
├── adapters/
│   └── templates/
│
├── evals/
│   ├── cases/
│   ├── fixtures/
│   ├── runners/
│   ├── rubric.md
│   └── results/
│
├── research/
│   ├── reference-mining/
│   ├── terminology/
│   ├── corpus/
│   └── sources/
│
├── tests/
│   ├── unit/
│   ├── installer/
│   ├── adapters/
│   └── e2e/
│
└── docs/
```

## Design rules

- Keep adapter files small.
- Keep language references small enough to reason about.
- Avoid nested reference chains.
- Keep research data separate from runtime package.
- Keep installer logic independent of language-rule content.

## Suggested TypeScript choice

The universal installer is naturally suited to TypeScript/Node because distribution target is `npx`.

Use lightweight dependencies.

Do not introduce a framework unless it clearly reduces complexity.

## Package files

Ensure npm package excludes:

- huge raw corpus
- unnecessary eval outputs
- private research notes
- temporary build artifacts

Include:

- CLI
- runtime adapter templates
- Skill/reference package
- necessary metadata
