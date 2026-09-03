# START HERE

You are implementing **Korean Context V1**, not merely a Phase 0 prototype.

The work is phased because language architecture must be proven before investing in broad adapters and corpus expansion, but **the final deliverable is the full V1 described in this package**.

## Final user experience

```bash
npx korean-context@latest
```

Interactive installer:

```text
Korean Context

Select agents:

[x] Claude Code        detected
[x] Codex              detected
[ ] Cursor
[ ] Gemini CLI
[ ] GitHub Copilot
[ ] OpenCode
[ ] Cline
[ ] Roo Code
[ ] Windsurf
[ ] Hermes Agent
...

Installation scope:

(*) Global
( ) Current project

Continue
```

The user selects agents only.

The installer determines whether that agent needs:

- persistent rules/instructions
- Agent Skill installation
- native plugin integration
- managed config blocks
- project/global paths
- verification steps

Do not ask ordinary users to understand these implementation details.

## What Korean Context modifies

Apply to Korean text intended for:

- commits
- PRs
- issues
- review comments
- code comments
- JSDoc/docstrings
- TODO/FIXME
- README/Markdown
- ADR/spec/design docs
- UI copy
- buttons/labels/dialogs/toasts
- validation/errors
- product CLI text
- test names/descriptions
- changelogs
- release notes
- migration guides
- other persistent/publishable artifacts

## What Korean Context does NOT modify

Do not apply it to:

- ordinary assistant conversation
- progress updates
- planning
- explanations
- questions
- general technical Q&A

A response can contain both normal conversation and an artifact draft. Apply Korean Context only to the artifact.

## Final architecture

```text
                         Korean Context
                               |
                  +------------+-------------+
                  |                          |
          Always-on bridge          Shared language SSOT
          (agent native)                     |
                  |           +--------------+--------------+
                  |           |              |              |
            Artifact gate    Core          Surface         Domain
                  |                           |              |
                  |                       Register      Terminology
                  |                           \              /
                  +----------------------------+-------------+
                                               |
                                            Artifact
```

## Non-goals for V1

Do not add:

- automatic learning from user edits
- user correction DB
- background LLM processing
- cross-agent memory synchronization
- embeddings
- vector DB
- daemon/server
- runtime browsing
- automatic upload of user artifacts
- whole-document AI-humanizer pipeline
- mandatory hooks merely because an agent supports hooks

## Required contextual dimensions

```text
Artifact Boundary
× Surface
× Domain
× Register
× Terminology
× Naturalness
× Existing Project/Artifact Style
```

## Rule priority

```text
explicit user instruction
>
existing artifact style
>
project convention
>
surface guidance
>
domain guidance
>
Korean Context baseline
```

## Phase gates

Do not skip gates.

### Phase 0
Prove compact language architecture.

### Phase 1
Expand verified public baseline and domains.

### Phase 2
Build agent adapters.

### Phase 3
Build universal installer.

### Phase 4
Run cross-agent quality/E2E hardening.

### Phase 5
Release V1 to npm/GitHub and publish support matrix.

Every phase has explicit exit criteria in its document.

## First action in implementation session

Read `docs/00-final-product-spec.md`, then execute `docs/15-full-implementation-checklist.md` in order.
