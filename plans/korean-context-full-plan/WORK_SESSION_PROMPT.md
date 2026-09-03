# Work Session Prompt

Use this prompt when opening a fresh Work/Codex implementation session.

---

Implement the **Korean Context V1** project according to this planning package.

Read `START_HERE.md` and all documents under `docs/` before changing architecture.

The final target is not Phase 0 only. Continue through all gated phases until the V1 Definition of Done is satisfied.

Critical constraints:

- Korean Context applies only to persistent/published Korean artifacts.
- It must not alter ordinary assistant conversation.
- Language knowledge has one shared source of truth.
- Agent adapters contain activation/installation logic, not forked Korean-writing rules.
- Do not rely solely on implicit Skill activation.
- Prefer a tiny always-on artifact activation bridge plus shared Agent Skill/references.
- Do not implement automatic user learning.
- Do not implement a user-memory DB.
- Do not use embeddings/vector DB.
- Do not require runtime network access.
- Do not add background LLMs.
- Do not add a detector → rewrite → judge hot-path pipeline.
- Do not add hooks merely because they exist.
- Default artifact generation should require zero extra model round-trips.
- Existing artifact/project writing style overrides Korean Context defaults.
- Technical correctness has higher priority than linguistic purification.
- Do not mechanically translate established technical terminology.

Before implementing an agent adapter, inspect the latest official docs and current released behavior for that agent. Agent paths, manifests, rule precedence, plugin systems, and subagent inheritance are version-sensitive.

Follow the phase gates:

1. Phase 0 — compact language core + 100 eval cases + Claude/Codex validation
2. Phase 1 — corpus/baseline/domain expansion
3. Phase 2 — broader agent adapters
4. Phase 3 — `npx korean-context@latest` universal installer
5. Phase 4 — quality, cross-agent E2E, platform hardening
6. Phase 5 — npm/GitHub V1 release, docs, support matrix, update workflow

Do not proceed past a phase if its hard gate fails. Fix the architecture or rules first.

Use eval-driven development for language rules: every generalized rule must have at least one regression/transfer eval.
