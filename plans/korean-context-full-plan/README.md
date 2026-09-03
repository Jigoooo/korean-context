# Korean Context — Full V1 Implementation Plan

This package contains the **complete implementation plan from Phase 0 validation through V1 release and maintenance**.

## Product in one sentence

**Korean Context makes AI-generated Korean artifacts use the wording, terminology, and register that Korean practitioners in the relevant context would actually use.**

It is **not** a general assistant-tone modifier and **not** an AI-humanizer.

## Final V1 target

V1 is complete when a user can run:

```bash
npx korean-context@latest
```

and then:

1. select one or more supported AI agents,
2. select Global or Current Project scope,
3. have Korean Context installed through the strongest safe native integration for each selected agent,
4. generate natural Korean artifacts consistently across supported agents,
5. update/repair/uninstall without destroying user configuration.

## V1 core decisions

- Applies only to persistent/published artifacts.
- Does not change ordinary assistant chat tone.
- Shared language knowledge is the single source of truth.
- Agent adapters contain activation/installation logic only.
- Do not rely solely on implicit Agent Skill activation.
- Use a small always-on artifact activation bridge where the agent supports persistent instructions/rules.
- Detailed language rules live in a shared Agent Skill/references.
- No automatic user learning.
- No local learning DB.
- No background LLM.
- No embeddings/vector DB.
- No runtime network dependency.
- No mandatory language-quality hooks.
- No default detector → rewrite → judge pipeline.
- Default generation requires zero additional model round-trips.
- Public baseline improves through Korean Context releases.

## Documents

Read in this order:

1. `START_HERE.md`
2. `docs/00-final-product-spec.md`
3. `docs/01-reference-mining-and-research.md`
4. `docs/02-final-architecture.md`
5. `docs/03-language-system.md`
6. `docs/04-corpus-and-domain-packs.md`
7. `docs/05-evaluation-strategy.md`
8. `docs/06-phase0-core-validation.md`
9. `docs/07-phase1-baseline-expansion.md`
10. `docs/08-phase2-agent-adapters.md`
11. `docs/09-phase3-universal-installer.md`
12. `docs/10-phase4-quality-and-cross-agent-e2e.md`
13. `docs/11-phase5-release-and-distribution.md`
14. `docs/12-maintenance-and-versioning.md`
15. `docs/13-security-privacy-and-safety.md`
16. `docs/14-repository-and-package-layout.md`
17. `docs/15-full-implementation-checklist.md`
18. `docs/16-definition-of-done.md`
19. `WORK_SESSION_PROMPT.md`

## Important implementation rule

Agent ecosystems change quickly.

Before implementing or modifying any adapter, **re-check the latest official documentation and current released behavior** of that agent. Do not assume a path or manifest in this plan is still current merely because it was current during planning.

The architecture is stable; adapter details are version-sensitive.
