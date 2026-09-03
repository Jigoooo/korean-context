# 13. Security, Privacy, and Safety

## 1. Core privacy posture

Korean Context V1:

- does not automatically learn from user edits
- does not store artifact history for language learning
- does not upload source code
- does not require a cloud language service
- does not require runtime browsing
- does not run a background model

## 2. Installer security

Installer modifies agent configuration.

Requirements:

- narrow ownership
- managed blocks
- validate target paths
- avoid shell injection
- never execute arbitrary repository content during installation
- sanitize package-relative paths
- prevent path traversal
- atomic/transactional writes where possible
- preserve file permissions when editing
- clear logs without secrets

## 3. Package supply-chain

Recommended:

- lock dependencies
- minimize dependency count
- inspect transitive dependencies
- CI package audit
- npm provenance/signing when appropriate
- GitHub protected release workflow

## 4. Security domain content

Security terminology support is language support, not operational exploitation logic.

Domain packs should explain wording/terminology, not introduce unnecessary executable offensive workflows.

## 5. User configuration

Never delete a full user AGENTS/rules/config file merely to uninstall Korean Context.

Remove only owned file/block.

## 6. Logging

Installer logs should not dump:

- complete config contents
- prompts
- source code
- tokens
- credentials

## 7. Future project overrides

If `.korean-context.yml` is added:

- schema validate
- treat as data, not executable code
- no arbitrary command support
