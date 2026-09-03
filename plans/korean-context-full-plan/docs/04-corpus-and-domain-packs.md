# 04. Corpus and Domain Pack Plan

## 1. Goal

Build a high-quality public baseline that requires no per-user learning.

## 2. Phase 1 data sources

Collect evidence from multiple source classes.

### Korean engineering writing

Examples of source types:

- Korean engineering blogs
- architecture posts
- Korean OSS PR/review discussions
- developer documentation
- conference materials

### Git collaboration

Need examples for:

- commit subject/body
- PR
- issue
- review

### Product/UX

Need:

- UI copy conventions
- button/label style
- error/validation style
- user-facing register

### Security

Need reputable Korean:

- CERT/advisory writing
- security vendor research
- vulnerability reports
- incident response material
- conference/research writing

## 3. Evidence quality fields

For each collected sample/source classify:

```yaml
original_language: ko | translated | unknown
author_type: practitioner | vendor | official_org | community | unknown
surface:
domain:
date:
confidence:
```

Prefer Korean originally written by practitioners.

## 4. Do not put raw corpus into runtime context

Raw corpus is build/research data.

Runtime outputs are distilled:

- generalized rules
- terminology statuses
- compact examples
- eval cases

## 5. Suggested baseline scale

Do not make counts a vanity metric.

Possible initial V1 target after Phase 0:

```text
core generalized rules:          ~50–150
surface-specific rules:          ~100–300
terminology concepts:            ~500–2,000
curated compact examples:        ~1,000–5,000
eval cases:                      several hundred+
```

Adjust based on measured utility.

## 6. Domain pack acceptance criteria

A pack is ready when:

- terminology evidence exists
- common mistranslations are covered
- at least one expert-facing and one general artifact context is represented where relevant
- tests include unseen transfer cases
- pack adds measurable value beyond generic software policy

## 7. Security pack acceptance

Security V1 must not be a token glossary.

It should cover meaningful language behavior across:

- vulnerability writeups
- pentest reports
- red-team reporting
- blue-team/incident material
- AppSec review
- cloud/IAM security

## 8. Corpus update pipeline

```text
Source discovery
→ evidence extraction
→ duplicate/concept clustering
→ terminology/rule proposal
→ human review
→ eval creation
→ eval pass
→ release
```

No automatic user telemetry is required.
