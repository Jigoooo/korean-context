# Korean Context V1 Roadmap and Progress Tracker

> **Canonical status document:** This is the single source of truth for implementation progress. Read it before work and update it before ending a session.

**Last updated:** 2026-09-05

**Current milestone:** v0.3 — Claude Code support research

**Detailed progress:** v0.2 implementation tasks 12/12 complete; GitHub prerelease `v0.2.0` published.

**V1 outlook:** Milestones 0–1 are complete, Milestone 2 is next, and Milestones 3–5 remain.

**Next task:** Research current Claude Code plugin, skill, persistent-instruction, scope, hook, and delegated-agent behavior before implementing Milestone 2.

**V1 supported agents:** Codex and Claude Code only

**Goal:** Release V1 with evidence-backed Korean artifact quality, safe Codex and Claude Code integration, and one-command installation.

**Architecture:** Keep one shared language-policy source under `plugins/korean-context/skills/korean-context`. Adapters contain only detection, activation, installation, verification, and lifecycle behavior. Project terminology and existing artifact style override Korean Context defaults.

**References:**

- Full product plan: `plans/korean-context-full-plan/`
- v0.1 design: `docs/superpowers/specs/2026-09-03-korean-context-v0-1-design.md`
- v0.1 plan: `docs/superpowers/plans/2026-09-03-korean-context-v0-1.md`
- v0.2 design: `docs/superpowers/specs/2026-09-04-korean-context-v0-2-design.md`
- v0.2 plan: `docs/superpowers/plans/2026-09-04-korean-context-v0-2.md`
- v0.1 evidence: `evals/results/v0.1/summary.md`

## Status and handoff rules

- Mark `[x]` only when evidence exists and the relevant verification passes.
- Leave `[ ]` for unstarted, partial, blocked, or unverified work and add a status note.
- This file overrides the checkbox state of the older master checklist.
- Do not expand the V1 agent list without an explicit product decision.
- Never copy private source, credentials, customer data, or unpublished history into this public repository.

At session start:

1. Read this file and the linked milestone plan.
2. Run `git status --short --branch` and inspect recent commits.
3. Resume the first unchecked item under the current milestone unless noted otherwise.
4. Re-check current official documentation before changing a version-sensitive adapter.

Before session end:

1. Run the relevant verification commands.
2. Update **Last updated**, **Current milestone**, **Next task**, and completed checkboxes.
3. Add a session-log entry with evidence paths or commit hashes.
4. Record blockers and failed checks; never mark partial work complete.
5. Remove generated caches and unrelated changes.

## Fixed V1 scope

- [x] Advertise only Codex and Claude Code as V1 agents.
- [x] Keep Gemini CLI and other agents out of V1.
- [x] Keep ordinary assistant conversation outside the artifact policy.
- [x] Exclude automatic learning, correction databases, embeddings, background models, runtime language-network calls, and mandatory hooks.
- [x] Keep project convention and existing artifact style above Korean Context defaults.

## Milestone 0 — v0.1 Codex vertical slice

**Status:** Completed and released as GitHub prerelease `v0.1.0`.

- [x] Publish `Jigoooo/korean-context` and the skills-only Codex plugin.
- [x] Add core policy, ten surface packs, and initial software/security domain packs.
- [x] Build and validate the 100-case corpus.
- [x] Run the fixed 30-case Codex baseline, explicit, and implicit comparisons.
- [x] Record zero observed technical corruption, severe terminology errors, and boundary violations in the fixed set.
- [x] Verify Codex install, reinstall, update, remove, and final reinstall.
- [x] Pass Windows, macOS, and Linux CI.
- [x] Publish the `v0.1.0` GitHub prerelease.

**Carried limitations:** Codex-only evidence, a small manually scored set, four clear repair gains out of ten over a strong baseline, one implicit format-adherence failure, and no persistent activation bridge.

## Milestone 1 — v0.2 real-world quality validation

**Goal:** Prove performance on difficult repository-shaped Korean artifacts before adding another agent.

### 1.1 Evaluation contract

- [x] Add a v0.2 design spec reflecting the approved evaluation architecture and release gates.
- [x] Review the written v0.2 design and approve the implementation-plan transition.
- [x] Add a task-level v0.2 implementation plan linked here.
- [x] Extend the case schema with register, project vocabulary, protected meaning, forbidden behavior, and anonymized provenance.
- [x] Define scoring for detection, rewrite quality, meaning preservation, project-style preservation, format adherence, and unnecessary edits.
- [x] Define deterministic hard failures before collecting model results.

### 1.2 Offen-derived fixture

- [x] Convert observed UI, comment, commit, PR, and documentation problems into minimal anonymized fixtures.
- [x] Add conflicts covering project-approved terms such as `위젯`, `배치`, `칸`, and `서랍`.
- [x] Add long artifacts containing identifiers, numbers, keyboard keys, and mixed Korean/English terminology.
- [x] Add natural Korean controls that must remain unchanged.
- [x] Verify that no private source, secret, customer data, or excessive copied context is committed.

### 1.3 Comparative evaluation

- [x] Run the deterministic copy scanner against the fixed fixture.
- [x] Run Codex without Korean Context against the same fixture.
- [x] Run Codex with explicit Korean Context activation against the same fixture.
- [x] Run the hardest fixed subset three times in fresh sessions to measure variance.
- [x] Score blind to mode where practical and retain raw outputs and rationale.

### 1.4 v0.2 release gate

- [x] Technical meaning corruption is `0`.
- [x] Project-approved terminology violations are `0`.
- [x] Assistant-conversation boundary violations are `0`.
- [x] Protected identifiers, numbers, commands, and keys are preserved in every explicit case.
- [x] Natural-text unnecessary rewrite rate is at most `5%`.
- [x] Required output-format adherence is at least `95%`.
- [x] At least `90%` of gold awkwardness issues are corrected without a hard failure.
- [x] Repeated runs contain no hard-failure variance.
- [x] Publish a reproducible report with limitations and exact agent/model versions.
- [x] Publish `v0.2.0` only after every hard gate passes.

## Milestone 2 — v0.3 Claude Code support

**Goal:** Add Claude Code without duplicating language knowledge or damaging existing configuration.

- [ ] Verify current plugin, skill, persistent-instruction, scope, hook, and delegated-agent behavior.
- [ ] Record the tested version, date, OS, scope behavior, and official documentation URLs.
- [ ] Document same-name user/project skill precedence and predecessor-skill migration.
- [ ] Implement global and project install, verify, update, repair, and uninstall.
- [ ] Add a compact artifact-only activation bridge without copying language references.
- [ ] Preserve unrelated `CLAUDE.md`, settings, plugins, hooks, and project instructions.
- [ ] Make installation idempotent with explicit ownership.
- [ ] Run explicit, implicit, boundary, project-vocabulary, delegated-agent, and lifecycle E2E tests.
- [ ] Run the representative v0.2 set on Codex and Claude Code.
- [ ] Measure activation reliability, context overhead, reference loading, and additional calls.
- [ ] Advertise Claude support only after every claimed capability has evidence.

## Milestone 3 — V1 language baseline expansion

**Goal:** Broaden domain coverage without regressing v0.2 quality and preservation.

- [ ] Expand database, data-platform, and AI/ML terminology.
- [ ] Expand blue-team/SOC, DFIR, malware/reverse-engineering, and cloud/IAM coverage.
- [ ] Record evidence, accepted variants, contextual forms, exceptions, and review dates.
- [ ] Add domain transfer, preservation, register-conflict, and specialist meaning tests.
- [ ] Keep research corpus separate from the runtime package.
- [ ] Demonstrate no material regression on v0.1 and v0.2 gates.

## Milestone 4 — Universal installer

**Goal:** Provide one safe lifecycle command for Codex and Claude Code.

- [ ] Convert the private development package into the publishable `korean-context` npm package.
- [ ] Add `npx korean-context@latest` with detected-agent selection and Global/Project scope.
- [ ] Implement only Codex and Claude Code adapters in the V1 registry.
- [ ] Add `--agent`, `--all`, `--global`, `--project`, `--yes`, and `--dry-run`.
- [ ] Add `install`, `status`, `update`, `repair`, and `uninstall` operations.
- [ ] Use managed ownership, structured edits, atomic writes, duplicate detection, and rollback.
- [ ] Preserve unrelated configuration byte-for-byte where the format permits it.
- [ ] Test clean, existing-config, damaged-block, repeat-install, update, repair, and uninstall scenarios.
- [ ] Test Windows, macOS, Linux, and relevant WSL path separation.

## Milestone 5 — V1 hardening and release

**Goal:** Release only behavior proven across both advertised agents and supported operating systems.

- [ ] Expand the fixed suite to several hundred cases without weakening existing gates.
- [ ] Run the same representative artifact set on Codex and Claude Code.
- [ ] Verify ordinary-chat boundaries and delegated-agent behavior.
- [ ] Measure bridge size, reference loads, latency, and additional calls.
- [ ] Confirm default extra model calls, runtime network calls, and background processes are all `0`.
- [ ] Complete installer lifecycle testing on Windows, macOS, Linux, and WSL where applicable.
- [ ] Audit npm contents and reproducible build output.
- [ ] Publish the npm V1 package and GitHub V1 release.
- [ ] Run clean-machine post-publish smoke installation for both agents.
- [ ] Publish a support matrix with exact versions, dates, and limitations.

## Post-V1 candidates

- [ ] Prioritize additional agents from real demand and maintainability evidence.
- [ ] Consider Gemini CLI only after full lifecycle and activation tests are possible.
- [ ] Add domains and terminology through issue-driven regression cases.
- [ ] Re-verify adapters whenever upstream behavior changes.

## Verification commands

```powershell
pnpm test
pnpm check
git diff --check
git status --short --branch
gh run list --repo Jigoooo/korean-context --limit 10
gh release list --repo Jigoooo/korean-context
git rev-list --left-right --count main...origin/main
```

## Session log

- 2026-09-05 — Completed v0.2 Task 12 and Milestone 1: finalized plugin version `0.2.0`, published the evidence summary and release notes, and verified install, same-version reinstall, remove, absence, final reinstall, and unchanged unrelated plugins. Fast-forwarded `feat/v0.2-eval-foundation` into `main`, pushed commit `b4b5655`, and required green CI run `33948224416` on Windows, macOS, and Ubuntu before creating tag and GitHub prerelease `v0.2.0`. Post-release installation from the GitHub tag passed one repair and one preserve smoke case, then the personal marketplace and final enabled install were restored to `C:\workspace\korean-context`. Next work is current Claude Code platform research for Milestone 2.

- 2026-09-05 — Completed v0.2 Task 11 on `feat/v0.2-eval-foundation`: isolated Codex memory and the timing-sensitive `paper` MCP server, strengthened failure-driven regressions through `0.2.0-rc.18`, and retained mode-blind scores with written rationale. Final public evidence contains 100 baseline runs, 101 raw/100 effective explicit runs, and 103 raw/100 effective v0.1 regression runs; original timeouts remain in JSONL while successful retries determine the effective records. The gate passed with average 9.87/10, explicit hard failures 0, unnecessary rewrite 0%, format adherence 100%, gold correction 100%, and repeated hard-failure variance 0. `pnpm check` passed with 193 tests, and the repository plus official plugin and skill validators passed. Public inputs are anonymized/synthetic; scoring is manual and the private Offen model audit was not run.

- 2026-09-04 — Completed v0.2 Task 10 on `feat/v0.2-eval-foundation`: built and installed `0.2.0-rc.1`, collected 100 baseline and 100 explicit public runs, and completed 100 effective v0.1 regressions while preserving one timeout retry in 101 raw records. Public model outputs use synthetic fixtures only. Offen local model transmission was not authorized, so the local-only copy and vocabulary scanners were used instead and passed with a clean Linux Git status. Added deterministic stderr path redaction after quarantining the original 301 records under ignored `.local/`; public privacy validation then passed. Full check passed with 181 tests. Next work is Task 11.

- 2026-09-04 — Completed v0.2 Task 9 on `feat/v0.2-eval-foundation`: added strict local source manifests, real-path containment, UTF-8 line-range reads, source hashing, append-only resume, and per-attempt source/Git immutability checks. Added the `.local`-only CLI and runbook. Verified 18 focused local and Codex runner tests, then passed the full check with 174 tests. Next work is Task 10.

- 2026-09-04 — Completed v0.2 Task 8 on `feat/v0.2-eval-foundation`: added 10 project-conflict, 10 long-artifact, five format, and five conversation-boundary cases; added the synthetic vocabulary, UI, and docs context plus the production manifest. The complete public suite now contains 60 cases, 20 repeated cases, and 160 cases with v0.1. `pnpm check` now includes v0.2 suite and privacy validation. Verified 33 focused tests, then passed the full check with 163 tests. Next work is Task 9.

- 2026-09-04 — Completed v0.2 Task 7 on `feat/v0.2-eval-foundation`: added 20 anonymized-derived repair cases across UI, error, comment, commit, PR, review, and docs surfaces; added 10 synthetic exact-output preservation controls and the minimal synthetic workspace README. Eight repair cases use three attempts. Verified 15 focused data-pack and privacy tests, then passed the full check with 158 tests. Next work is Task 8.

- 2026-09-04 — Completed v0.2 Task 6 on `feat/v0.2-eval-foundation`: added strict v0.2 manual scores, complete-attempt and configuration gates, v0.1 regression enforcement, explicit-only quality thresholds, hard-failure variance, score JSONL loading, and the score CLI. Updated the rubric with boolean, gold issue, blind-review, and second-review rules. Verified 28 focused v0.2/v0.1 score tests, then passed the full check with 153 tests. Next work is Task 7.

- 2026-09-04 — Completed v0.2 Task 5 on `feat/v0.2-eval-foundation`: added deterministic run-status, empty-output, protected-token, substring, regular-expression, project-vocabulary, and required-format violations. Suite validation now rejects invalid patterns and ambiguous `exact-output` definitions before model evaluation. Verified 40 focused tests, then passed the full check with 127 tests. Next work is Task 6.

- 2026-09-04 — Completed v0.2 Task 4 on `feat/v0.2-eval-foundation`: added the shared shell-free Codex process boundary, controlled `xhigh` execution, deterministic fixture and prompt hashes, compatible run manifests, append-only resume and timestamped reset backups, plus single-attempt v0.1 regression execution. Verified 37 focused runner and storage tests, then passed the full check with 108 tests. Confirmed the adapter against the current official CLI/configuration references and local `codex-cli 0.147.0`. Next work is Task 5.

- 2026-09-04 — Completed v0.2 Task 3 on `feat/v0.2-eval-foundation`: added versioned run manifests and attempt records, append-only JSONL storage, composite resume keys, effective-record selection, successful-run filtering, same-file concurrent append serialization, and original JSONL line reporting. Verified 17 focused and v0.1 runner tests, then passed the full check with 88 tests. Next work is Task 4.
- 2026-09-04 — Completed v0.2 Task 2 on `feat/v0.2-eval-foundation`: added relative-path privacy findings, recursive public artifact validation, source-link orchestration, a thin validation CLI, `.local/` exclusion, and the `eval:v0.2:validate` script. Verified 31 focused tests, then passed the full check with 75 tests. Next work is Task 3.
- 2026-09-04 — Completed v0.2 Task 1 on `feat/v0.2-eval-foundation`: added strict versioned case/manifest schemas and a manifest-driven loader while preserving the v0.1 loader. Verified 23 focused and v0.1 regression tests, then passed the full check with 59 tests. Next work is Task 2.
- 2026-09-04 — Approved the written v0.2 design and added a 12-task test-driven implementation plan. Self-review confirmed complete task numbering, explicit interfaces, v0.1 compatibility, public/local isolation, and baseline/explicit gate separation. Next work is Task 1; implementation has not started.
- 2026-09-04 — Approved the hybrid public-fixture and local-Offen evaluation architecture, the 160-case structure, scoring, repetition, error handling, and release gates. Wrote the v0.2 design spec; implementation has not started.
- 2026-09-04 — Restricted V1 support to Codex and Claude Code. Selected v0.2 real-world validation before v0.3 Claude Code support. Verified `pnpm check` with 44 passing tests and confirmed the latest `main` CI succeeded. Created this canonical tracker; v0.2 implementation has not started.
