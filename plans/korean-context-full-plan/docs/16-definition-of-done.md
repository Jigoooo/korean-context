# 16. V1 Definition of Done

V1 is complete only when all conditions below are satisfied.

## Product behavior

- [ ] Applies only to Korean artifacts.
- [ ] Does not globally change assistant conversation.
- [ ] Uses surface/domain/register context.
- [ ] Preserves existing artifact/project style.
- [ ] Preserves technical meaning.
- [ ] Avoids mechanical technical translation.
- [ ] Does not over-edit natural Korean.

## Architecture

- [ ] Shared language SSOT.
- [ ] Tiny always-on bridge.
- [ ] Shared Agent Skill/references.
- [ ] No language-rule forks in adapters.
- [ ] No automatic user-learning system.
- [ ] No mandatory DB.
- [ ] No runtime network language dependency.
- [ ] No default background LLM.
- [ ] No default multi-pass rewrite pipeline.

## Language coverage

- [ ] Git surfaces.
- [ ] Review.
- [ ] Source comments.
- [ ] Docs.
- [ ] UI/errors.
- [ ] Tests/releases.
- [ ] General software domains.
- [ ] Meaningful security coverage.

## Quality

At minimum, Phase 0 hard gates continue to pass:

```text
awkwardness improvement >= 90%
technical meaning corruption = 0
severe terminology mistranslation = 0
unnecessary rewrite <= 5%
register conflict error <= 5%
assistant-chat boundary violation <= 5%
transfer success >= 85%
```

Expanded V1 suite must show no material regression.

## Performance

- [ ] Default extra model calls = 0.
- [ ] Runtime network = 0.
- [ ] Background process = 0.
- [ ] Always-on bridge remains compact.
- [ ] Large research corpus is not always loaded.

## Agent support

- [ ] Claude Code verified.
- [ ] Codex verified.
- [ ] Every additional advertised agent has install/activation/boundary/update/uninstall E2E.
- [ ] Support matrix lists verified versions/date.
- [ ] Delegated/subagent limitations documented.

## Installer

User can run:

```bash
npx korean-context@latest
```

and:

- [ ] select multiple agents
- [ ] select global/project
- [ ] install without learning platform internals
- [ ] re-run safely
- [ ] update
- [ ] repair
- [ ] uninstall
- [ ] preserve unrelated config

## Platform

- [ ] Windows supported/tested.
- [ ] macOS supported/tested.
- [ ] Linux supported/tested.
- [ ] WSL handled where relevant.

## Distribution

- [ ] npm V1 published.
- [ ] GitHub V1 release published.
- [ ] README install flow correct.
- [ ] Support matrix correct.
- [ ] CHANGELOG present.
- [ ] SECURITY policy present.
- [ ] CI green.
- [ ] Post-publish smoke test passes.

## Maintenance

- [ ] Rule changes require evals.
- [ ] Terminology changes have evidence.
- [ ] Adapter drift has a documented update process.
- [ ] Public baseline update workflow documented.

When every section passes, Korean Context V1 is done.
