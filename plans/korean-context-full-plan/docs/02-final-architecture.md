# 02. Final Architecture

## 1. Components

### A. Shared Agent Skill

Purpose:

- workflow
- artifact gate
- pointer to detailed references
- same across supported agents

### B. Core references

- artifact boundary
- naturalness
- translationese
- terminology
- register

### C. Surface packs

- commit
- PR
- issue
- review
- comment
- docs
- UI
- errors
- tests
- releases

### D. Domain packs

General software + security domains.

### E. Agent adapters

Only:

- installation
- native persistent activation
- Skill discovery
- config ownership
- platform verification
- delegated/subagent inheritance handling

### F. Universal installer

```bash
npx korean-context@latest
```

### G. Eval framework

Language and installation/E2E tests.

## 2. Language SSOT

There must be only one canonical language knowledge set.

Forbidden:

```text
adapters/claude/korean-policy.md
adapters/codex/korean-policy.md
```

Preferred:

```text
skills/korean-context/references/*
```

Adapters may include a tiny activation bridge, but not independent Korean-writing knowledge.

## 3. Always-on bridge

Purpose:

- apply Korean Context to artifacts
- exclude conversation
- preserve project/artifact style
- point to shared Skill

Target <= 500 tokens.

Do not include:

- thousands of examples
- domain dictionaries
- full security glossary
- whole translationese taxonomy

## 4. Skill structure

Recommended:

```text
skills/
└── korean-context/
    ├── SKILL.md
    └── references/
        ├── core-artifact-boundary.md
        ├── core-naturalness.md
        ├── core-translationese.md
        ├── core-terminology.md
        ├── core-register.md
        ├── surface-*.md
        └── domain-*.md
```

Keep references shallow.

## 5. Generation flow

```text
User asks agent to do work
        |
Will Korean artifact text be created/edited?
        |
      no ----------------> normal agent behavior
        |
       yes
        |
Identify surface
        |
Identify domain
        |
Existing artifact style?
    /          \
 yes            no
  |              |
preserve      use surface default
    \          /
      Register
        |
Terminology + Naturalness
        |
Write once
        |
Same-generation short check
        |
Artifact
```

## 6. No default post-processor

Do not add:

```text
draft
→ second model
→ critique
→ third model
→ rewrite
```

unless a future measured need justifies an optional validator.

## 7. Config ownership

Where shared user files must be edited, use managed blocks.

Example:

```text
<!-- korean-context:start -->
...
<!-- korean-context:end -->
```

Structured formats should use native structured edits instead of comments if comments are invalid.

## 8. Platform capability registry

Installer should use a registry such as:

```ts
interface AgentAdapter {
  id: string
  displayName: string
  detect(): Promise<DetectionResult>
  install(ctx: InstallContext): Promise<InstallResult>
  verify(ctx: InstallContext): Promise<VerifyResult>
  update(ctx: InstallContext): Promise<InstallResult>
  uninstall(ctx: InstallContext): Promise<UninstallResult>
  capabilities: {
    global: boolean
    project: boolean
    persistentInstructions: boolean
    skills: boolean
    nativePlugin: boolean
    delegatedInheritance: "yes" | "partial" | "no" | "unknown"
  }
}
```

Exact implementation is flexible; interface responsibilities are not.

## 9. Project-specific overrides

Not required in initial Phase 0.

V1 may support explicit project config only if it remains lightweight.

Possible:

```text
.korean-context.yml
```

No automatic mutation.

Possible contents:

- preferred terminology
- avoided terminology
- register override

This must remain optional and explicit.
