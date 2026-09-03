# 09. Phase 3 — Universal Installer

## Goal

Ship one user-facing installation command.

```bash
npx korean-context@latest
```

## UX

### Step 1 — Agent selection

Multi-select detected and supported agents.

Detected agents checked by default, but user may change selection.

### Step 2 — Scope

```text
Global
Current project
```

### Step 3 — Install summary

Show selected agents and integration status.

Do not ask user to choose:

- Skill
- plugin
- rule
- hook
- manifest

## Installer architecture

Suggested modules:

```text
installer/
├── cli/
├── registry/
├── detection/
├── adapters/
├── filesystem/
├── managed-block/
├── verification/
└── reporting/
```

## Commands

Primary:

```bash
npx korean-context@latest
```

Automation flags:

```bash
npx korean-context --agent claude-code --agent codex
npx korean-context --all
npx korean-context --global --all --yes
npx korean-context --project --agent cursor
```

Optional explicit commands if useful:

```bash
korean-context install
korean-context update
korean-context repair
korean-context uninstall
korean-context status
```

But do not make users memorize them for basic use.

## Idempotency

Re-running primary command must safely update existing Korean Context installation.

## Managed config requirements

- preserve unrelated content
- do not overwrite whole shared config
- detect duplicate owned blocks
- atomic write where possible
- syntax validation for structured formats
- rollback on failed mutation where practical

## Cross-platform

E2E:

- Windows
- macOS
- Linux
- WSL where paths/agent installs differ meaningfully

## Detection

Detection should consider:

- executable presence
- expected config directory
- native app/CLI state where reliable

Do not infer support from one file alone.

## Installer output

Example:

```text
Installed Korean Context

Claude Code   ✓ Full
Codex         ✓ Full
Cursor        ✓ Full

Scope: Global

Language core: 1.0.0
Adapters: current
```

## Phase 3 exit criteria

- one-command install works
- multi-select works
- scope selection works
- idempotent update works
- repair/uninstall works
- no destructive config edits
- Windows/macOS/Linux CI/E2E passes
