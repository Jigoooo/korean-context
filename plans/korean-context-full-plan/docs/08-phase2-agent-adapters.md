# 08. Phase 2 — Agent Adapters

## Entry requirement

Phase 1 baseline stable.

## Goal

Make Korean Context work consistently across major agent ecosystems using native mechanisms.

## Rule

Before each adapter:
**verify latest official documentation and current release behavior.**

Do not implement from memory alone.

## Initial adapter set

Already validated in Phase 0:

- Claude Code
- Codex

Then investigate:

- Cursor
- Gemini CLI
- GitHub Copilot / CLI
- OpenCode
- Cline
- Roo Code
- Windsurf
- Hermes Agent
- Kiro
- Qwen Code
- Kimi CLI
- Continue
- other active Agent Skills-compatible tools

## Adapter responsibilities

Each adapter implements:

1. detect agent
2. identify current native persistent-instruction mechanism
3. identify Agent Skill support
4. identify global/project scopes
5. install minimal activation bridge
6. install/link shared Skill
7. preserve existing user config
8. verify installation
9. update owned data
10. uninstall owned data
11. document subagent/delegated inheritance behavior

## Support levels

Internally classify:

### Full Native

Persistent instruction + Skill + verified delegation where supported.

### Full Core

Persistent instruction + Skill, but platform lacks richer native facilities.

### Limited

Only if unavoidable. Do not market Limited as equivalent without disclosure.

## No fake support

A platform is supported only after:

- install E2E
- artifact activation test
- assistant-chat boundary test
- update test
- uninstall test
- existing-config preservation test

## Adapter metadata

Store:

```yaml
id:
display_name:
verified_version:
verified_date:
official_docs:
global_scope:
project_scope:
persistent_instruction:
skill_support:
native_plugin:
delegated_inheritance:
notes:
```

This makes platform drift maintainable.

## Phase 2 exit criteria

- agreed V1 agent list implemented
- each support claim backed by E2E test
- language data not duplicated
- main/delegated behavior documented
