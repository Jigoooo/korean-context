# 11. Phase 5 — V1 Release and Distribution

## Goal

Publish a production-ready V1.

## 1. npm package

Package target:

```text
korean-context
```

Requirements:

- Node version floor documented
- executable/bin configured
- package files audited
- no unnecessary corpus/research bulk in npm package
- deterministic build
- package provenance/signing if available and appropriate

## 2. GitHub repository

Include:

- README
- install instructions
- supported-agent matrix
- architecture overview
- contributing guide
- security policy
- changelog
- license
- release notes

## 3. README first screen

Keep simple.

```text
Korean Context
Natural Korean for AI-generated artifacts.

Install:
npx korean-context@latest
```

Then explain:

- what it changes
- what it does not change
- supported agents
- examples
- privacy/no-learning policy

## 4. Support matrix

Example columns:

- Agent
- Verified version
- Global
- Project
- Persistent activation
- Skill
- Delegated/subagent
- Status

Do not use vague "70+ agents" marketing unless all are actually tested/supported.

## 5. CI

Minimum:

- lint
- typecheck
- unit tests
- installer filesystem tests
- eval schema validation
- package build
- npm pack inspection
- OS matrix where feasible

Adapter E2E may need conditional jobs.

## 6. Release process

```text
main green
→ version bump
→ changelog
→ npm package check
→ GitHub release
→ npm publish
→ smoke install
→ support matrix update
```

## 7. Versioning

Use SemVer.

Consider:

- patch: rule/eval fixes, adapter bug fixes
- minor: new domains/surfaces/agents
- major: incompatible installer/config behavior

Language baseline changes can still be behaviorally meaningful; document them clearly.

## 8. V1 release notes

Must explicitly state:

- no automatic user learning
- no artifact upload
- no background LLM
- no runtime network dependency for language policy
- ordinary assistant conversation is out of scope
