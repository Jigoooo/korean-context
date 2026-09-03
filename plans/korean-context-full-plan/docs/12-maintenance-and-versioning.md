# 12. Maintenance and Versioning

## 1. Public baseline update model

```text
new issue/evidence
→ research
→ rule/terminology candidate
→ eval
→ review
→ release
```

## 2. Rule change policy

Every rule change must answer:

- What failure does this fix?
- Which surfaces/domains?
- What exceptions exist?
- Which eval protects it?
- Could it over-edit natural Korean?

## 3. Terminology change policy

Terminology can evolve.

Store:

- last reviewed date
- domain
- status
- evidence references
- exceptions

Do not silently convert accepted variants into "wrong."

## 4. Adapter maintenance

Agent adapter is version-sensitive.

When upstream changes:

1. reproduce with latest release
2. update adapter metadata
3. run install/update/uninstall E2E
4. run artifact/boundary tests
5. release adapter fix

## 5. Data/package separation

Research data may be large.

Runtime package should contain only what agents need.

Possible layout:

```text
research-data/
build-data/
package-runtime/
```

Do not ship raw research unnecessarily.

## 6. Community contribution

Accept:

- unnatural phrase reports
- terminology evidence
- new domain requests
- agent adapter fixes
- eval cases

Require context, not just:

```text
X word is bad.
```

## 7. No automatic telemetry requirement

V1 should function without uploading:

- prompts
- source code
- artifacts
- corrections

If analytics are ever added, make them separately reviewed and privacy-preserving.
