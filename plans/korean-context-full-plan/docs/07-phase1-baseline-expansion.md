# 07. Phase 1 — Baseline and Domain Expansion

## Entry requirement

Phase 0 passed.

## Goal

Turn the validated compact system into a broad V1 Korean professional-writing baseline.

## Workstreams

### A. Reference mining

Expand Humanize/Fluent research and Korean technical-writing sources.

### B. Surface depth

Improve:

- commit conventions
- PR tone
- code-review conversational professionalism
- README/spec distinctions
- UI component-specific wording
- error/validation copy
- release/changelog style

### C. Software domains

Expand:

- frontend
- backend
- database
- infra/devops
- AI/ML

### D. Security

Build substantial packs for:

- common
- AppSec
- vulnerability
- pentest
- red team
- blue team/SOC
- DFIR
- malware/reverse engineering
- cloud/IAM

### E. Register evidence

Validate defaults against real artifact usage.

## Data quality requirements

- prefer original Korean
- annotate translated sources
- avoid one-company style becoming universal rule
- distinguish accepted variation
- preserve multiple common forms when industry usage varies

## Terminology policy

Do not force a single winner when evidence supports multiple forms.

Example:

```yaml
forms:
  - text: ...
    status: preferred
  - text: ...
    status: accepted
  - text: ...
    status: contextual
```

## Evaluation expansion

Increase evals beyond Phase 0.

Add:

- more unseen transfer tests
- natural-text preserve tests
- specialized security meaning tests
- multiple register conflicts
- mixed Korean/English terminology tests
- artifact-with-code/identifiers protection tests

## Phase 1 exit criteria

- core/surface/domain packs have evidence-backed coverage
- no regression on Phase 0
- security terminology passes specialist tests
- corpus/runtime separation remains intact
- always-on context remains compact
