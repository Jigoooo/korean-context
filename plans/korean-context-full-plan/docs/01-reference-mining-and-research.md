# 01. Reference Mining and Research

## 1. Reference categories

Before implementing final rules, inspect current versions of:

- Humanize Korean variants
- Fluent Korean
- Superpowers
- Agent Skills implementations
- popular cross-agent skills/plugins/installers
- Korean technical-writing guidance
- Korean-native developer writing
- Korean security writing
- Korean UX-writing guidance

## 2. Existing Korean skill strategy

Classify every useful idea:

### REUSE

Examples:

- semantic preservation
- protection of identifiers/URLs/numbers/code
- register consistency
- actual usage over dictionary possibility
- progressive disclosure
- avoid pointless rewriting

### ADAPT

Examples:

- translationese taxonomy
- passive voice warnings
- nominalization warnings
- English pronoun problems
- excessive connective patterns
- technical-term protection

Transform these from:

```text
detect after generation
```

to:

```text
generation policy + regression eval
```

### REJECT

Do not import:

- AI-human-likeness scoring
- rewrite percentage
- detector confidence as main architecture
- multi-stage rewrite pipelines
- repeated whole-text rewriting
- general assistant tone replacement
- forcing all model thinking/output into Korean
- giant always-on output styles
- runtime research
- user-edit learning
- background LLM evaluation

## 3. Known weaknesses to architect around

### Over-editing

Countermeasure:
Preserve tests + explicit "natural Korean is not an error."

### Taxonomy/context overhead

Countermeasure:
Small bridge, selective reference loading, no detector stage.

### Genre/context false positives

Countermeasure:
Surface × Domain × Register × Existing Style.

### Technical-domain mismatch

Countermeasure:
First-class domain packs, especially security.

### General conversation contamination

Countermeasure:
Artifact Boundary + Boundary evals.

### Subagent inconsistency

Countermeasure:
Adapter E2E tests for delegated work.

### Platform drift

Countermeasure:
Adapter metadata records verified version/date and links to official behavior.

## 4. Research evidence hierarchy

Prefer:

1. Korean professionals writing Korean originally
2. official Korean technical/security documentation
3. Korean OSS collaboration
4. professional UX/product writing
5. translated documentation only as secondary evidence

Avoid treating machine-translated or AI-generated Korean as evidence of natural Korean usage.

## 5. Research output format

Use structured notes:

```yaml
source:
date_checked:
category:
domain:
surface:
finding:
decision: reuse | adapt | reject
generalized_rule:
exceptions:
eval_ids:
```

## 6. Copyright/data rule

Do not ship copied corpora/articles.

Extract:

- usage preference
- collocations
- terminology status
- register
- failure patterns
- independently written examples

Store source citations/evidence in research metadata, not large copied passages.
