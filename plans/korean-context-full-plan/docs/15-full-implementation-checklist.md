# 15. Full Implementation Checklist

This is the master execution checklist from empty repository to V1.

---

## Phase 0 — Prove the language architecture

### 0.1 Research

- [ ] Verify current Agent Skills specification.
- [ ] Re-read latest Humanize Korean variants.
- [ ] Re-read latest Fluent Korean.
- [ ] Inspect latest Superpowers/cross-agent packaging.
- [ ] Verify current Claude Code persistent-rule and Skill behavior.
- [ ] Verify current Codex persistent-instruction and Skill/plugin behavior.
- [ ] Save research metadata/date/version.

### 0.2 Repository bootstrap

- [ ] Create TypeScript/Node project skeleton.
- [ ] Add lint/typecheck/test tooling.
- [ ] Add `skills/korean-context`.
- [ ] Add eval schema and validator.

### 0.3 Build eval first

- [ ] Repair 45
- [ ] Generation 15
- [ ] Preserve 10
- [ ] Conflict 10
- [ ] Transfer 10
- [ ] Boundary 10
- [ ] Validate 100 total.

### 0.4 Baseline

- [ ] Run Claude no-rule baseline.
- [ ] Run Codex no-rule baseline.
- [ ] Save results.

### 0.5 Core policy

- [ ] Artifact Boundary.
- [ ] Naturalness.
- [ ] Translationese.
- [ ] Terminology.
- [ ] Register.
- [ ] Compact `SKILL.md`.

### 0.6 Surface packs

- [ ] Commit.
- [ ] PR.
- [ ] Issue.
- [ ] Review.
- [ ] Comment/JSDoc.
- [ ] Docs.
- [ ] UI.
- [ ] Error/validation.
- [ ] Test.
- [ ] Release.

### 0.7 Minimal domain packs

- [ ] Software.
- [ ] Frontend.
- [ ] Backend.
- [ ] Infra.
- [ ] Security common.
- [ ] AppSec.
- [ ] Vulnerability.
- [ ] Pentest/redteam.

### 0.8 Claude adapter

- [ ] Persistent bridge.
- [ ] Shared Skill installation.
- [ ] Global verification.
- [ ] Project verification if supported.
- [ ] Config preservation.
- [ ] Boundary test.
- [ ] Artifact test.
- [ ] Delegation test/documentation.

### 0.9 Codex adapter

- [ ] Research current preferred persistent mechanism.
- [ ] Persistent bridge.
- [ ] Shared Skill.
- [ ] CLI/App validation as targeted.
- [ ] Config preservation.
- [ ] Boundary test.
- [ ] Artifact test.
- [ ] Delegation test/documentation.

### 0.10 Phase 0 evaluation

- [ ] Skill-only results.
- [ ] Always-on + Skill results.
- [ ] Hard gates pass.
- [ ] Performance gates pass.
- [ ] Phase 0 report.

**Do not proceed if Phase 0 fails.**

---

## Phase 1 — Build V1 public baseline

### 1.1 Research corpus

- [ ] Korean-native developer sources.
- [ ] Git collaboration.
- [ ] UX/product writing.
- [ ] Security sources.
- [ ] Evidence annotations.

### 1.2 Software domains

- [ ] Frontend expanded.
- [ ] Backend expanded.
- [ ] Database.
- [ ] Infrastructure/DevOps.
- [ ] AI/ML.

### 1.3 Security domains

- [ ] Common.
- [ ] AppSec.
- [ ] Vulnerability.
- [ ] Pentest.
- [ ] Redteam.
- [ ] Blueteam/SOC.
- [ ] DFIR.
- [ ] Malware/RE.
- [ ] Cloud/IAM.

### 1.4 Terminology

- [ ] preferred/accepted/contextual/avoid model.
- [ ] evidence metadata.
- [ ] mixed Korean/English conventions.
- [ ] acronym handling.
- [ ] first-mention conventions.

### 1.5 Expand eval

- [ ] add domain tests.
- [ ] add transfer tests.
- [ ] add preserve tests.
- [ ] add register conflict tests.
- [ ] no Phase 0 regression.

---

## Phase 2 — Build cross-agent adapters

For each target:

- [ ] verify latest official docs
- [ ] record verified version/date
- [ ] detection
- [ ] global installation
- [ ] project installation
- [ ] persistent bridge
- [ ] Skill integration
- [ ] config preservation
- [ ] verify
- [ ] update
- [ ] uninstall
- [ ] boundary E2E
- [ ] artifact E2E
- [ ] delegated/subagent behavior
- [ ] support status

Target queue:

- [ ] Claude Code
- [ ] Codex
- [ ] Cursor
- [ ] Gemini CLI
- [ ] GitHub Copilot
- [ ] OpenCode
- [ ] Cline
- [ ] Roo Code
- [ ] Windsurf
- [ ] Hermes Agent
- [ ] Kiro
- [ ] Qwen Code
- [ ] Kimi CLI
- [ ] Continue
- [ ] other validated Agent Skills clients

Do not require all conceivable tools for V1; publish only agents actually tested.

---

## Phase 3 — Universal installer

### 3.1 CLI

- [ ] `npx korean-context@latest`
- [ ] agent multi-select
- [ ] detected badges
- [ ] global/project scope
- [ ] install summary
- [ ] clear failure reporting

### 3.2 Noninteractive

- [ ] `--agent`
- [ ] `--all`
- [ ] `--global`
- [ ] `--project`
- [ ] `--yes`
- [ ] `--dry-run`

### 3.3 Lifecycle

- [ ] install
- [ ] update
- [ ] repair
- [ ] uninstall
- [ ] status

### 3.4 Filesystem safety

- [ ] managed blocks
- [ ] structured config edits
- [ ] atomic writes
- [ ] backups/rollback where appropriate
- [ ] no unrelated config loss
- [ ] duplicate block detection

### 3.5 OS

- [ ] Windows
- [ ] macOS
- [ ] Linux
- [ ] WSL-specific cases where applicable

---

## Phase 4 — Quality/E2E hardening

- [ ] expanded language suite
- [ ] cross-agent common task set
- [ ] activation-rate comparison
- [ ] assistant-chat boundary comparison
- [ ] security deep tests
- [ ] register tests
- [ ] preserve tests
- [ ] transfer tests
- [ ] delegated agent tests
- [ ] installer clean/update/repair/uninstall matrix
- [ ] token/context measurement
- [ ] no added runtime network/model calls

---

## Phase 5 — V1 release

### Package

- [ ] npm package
- [ ] bin command
- [ ] package contents audit
- [ ] SemVer
- [ ] reproducible build

### Repository

- [ ] README
- [ ] support matrix
- [ ] CONTRIBUTING
- [ ] SECURITY
- [ ] CHANGELOG
- [ ] LICENSE
- [ ] architecture docs

### CI/release

- [ ] lint
- [ ] typecheck
- [ ] unit
- [ ] installer tests
- [ ] adapter tests
- [ ] eval schema
- [ ] npm pack smoke
- [ ] release workflow
- [ ] npm publish
- [ ] post-publish smoke install

### V1 communication

- [ ] state artifact-only scope
- [ ] state no auto-learning
- [ ] state no artifact upload
- [ ] state no runtime cloud dependency
- [ ] list only verified supported agents
- [ ] document known limitations

---

## Post-V1

- [ ] issue-driven regression evals
- [ ] terminology updates
- [ ] domain expansion
- [ ] adapter maintenance
- [ ] support-matrix refresh
- [ ] periodic baseline releases
