# 05. Evaluation Strategy

## 1. Evaluation philosophy

Korean Context succeeds only if it improves bad artifact Korean **without damaging good Korean or technical meaning**.

## 2. Phase 0 — 100 cases

### Repair — 45

Intentionally awkward text.

### Generation — 15

Generate artifact directly from code/diff/context.

### Preserve — 10

Already-natural Korean.

### Conflict — 10

Korean Context default conflicts with existing artifact style.

### Transfer — 10

Unseen wording testing generalized principles.

### Boundary — 10

Ordinary assistant conversation must not be targeted.

## 3. Required surfaces

Represent:

- commit
- PR
- issue
- review
- comment/JSDoc
- docs/Markdown
- UI/error
- tests/release

## 4. Required domains

Represent:

- general software
- frontend/backend/infra
- security

Security must include meaningful specialist terms.

## 5. Scoring

0–2 each:

- Naturalness
- Terminology
- Meaning preservation
- Surface fit
- Translationese

Total 10.

Optional later:

- register
- verbosity
- unnecessary rewrite
- audience fit

## 6. Phase 0 hard gates

```text
awkwardness improvement >= 90%
technical meaning corruption = 0
severe terminology mistranslation = 0
unnecessary rewrite <= 5%
register conflict error <= 5%
assistant-chat boundary violation <= 5%
transfer success >= 85%
target average >= 8.5/10
```

Technical corruption is a hard failure even if average score passes.

## 7. Performance gates

Default path:

```text
extra LLM calls = 0
runtime network = 0
background process = 0
learning DB = 0
embeddings = 0
mandatory hooks = 0
```

Always-on bridge target <= 500 tokens.

## 8. Baselines

Compare:

- no custom instruction
- Humanize-style repair baseline where appropriate
- Fluent/global Korean baseline
- Korean Context Skill-only
- Korean Context always-on + Skill/reference

Do not overstate fairness between post-edit and generation-time tools.

## 9. Agent consistency

For every supported agent record:

- activation rate
- quality score
- boundary violations
- reference-loading behavior
- subagent/delegation behavior
- context overhead

## 10. Regression policy

Any real bug that creates or changes a rule requires a regression test.

Any generalized rule needs at least one transfer test.
