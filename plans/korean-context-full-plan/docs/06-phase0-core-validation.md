# 06. Phase 0 — Core Validation

## Goal

Prove that the compact architecture solves the target Korean failures before large-scale investment.

## Deliverables

### Core

- `SKILL.md`
- artifact boundary
- naturalness
- translationese
- terminology
- register

### Surfaces

At minimum:

- commit
- PR
- review
- comments
- docs
- UI/error
- test/release

### Domains

At minimum:

- software
- frontend/backend/infra basics
- security common
- security AppSec/vulnerability/pentest/redteam basics

### Eval

100 cases.

### Agents

- Claude Code
- Codex

## Implementation order

1. Verify latest platform docs.
2. Build 100-case skeleton.
3. Run no-rule baseline.
4. Write compact core.
5. Add surface packs.
6. Add minimal domain packs.
7. Implement Claude persistent bridge.
8. Implement Codex persistent bridge.
9. Install shared Skill.
10. Run Skill-only comparison.
11. Run always-on + Skill comparison.
12. Fix rules driven by failing evals.
13. Re-run fresh sessions.
14. Record Phase 0 report.

## Phase 0 exit gate

All Phase 0 language/performance hard gates in `05-evaluation-strategy.md` must pass.

If failure comes from:

- over-editing → fix preservation/boundary policy
- domain term errors → fix domain pack
- register mismatch → fix precedence/register
- activation inconsistency → fix adapter/bridge
- context overhead → shrink bridge/references

Do not "solve" failure by adding a second LLM pass.

## Output

Create:

```text
docs/results/phase0-report.md
```

Include:

- tested agent versions
- date
- exact installation approach
- baseline results
- Korean Context results
- failures
- fixes
- context/performance measurements
- Phase 0 pass/fail
