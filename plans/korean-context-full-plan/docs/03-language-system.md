# 03. Language System

## 1. Artifact Boundary

Apply based on intended destination, not simply because Korean appears.

Artifact draft shown in chat:
apply.

Assistant explanation shown only in chat:
do not apply.

## 2. Naturalness

### Actual usage over dictionary validity

```text
견주다
```

is valid Korean but often unnatural in technical comparisons where `비교하다` is normal.

Rules must model context, not banned vocabulary.

### Precise verbs over abstract nominalization

```text
캐시의 무효화를 수행한다.
→ 캐시를 무효화한다.
```

### Do not over-formalize

Professional != bureaucratic.

Review unnecessary:

- 해당
- 관련하여
- 이에 따라
- 이를 통해
- 수행
- 진행
- 실시

Never ban globally.

### Do not manufacture synonyms

Correct technical terms can repeat.

### Preserve natural Korean

Already-good text should survive.

## 3. Translationese

Warning families:

- mechanical `의`
- mechanical `~에 대한`
- mechanical `~에서의`
- English pronouns
- long translated relative clauses
- excessive passive
- English-derived noun-heavy syntax
- empty connective scaffolding
- generic result verbs
- literal technical translation

Treat as contextual warnings.

## 4. Terminology

Data model:

```yaml
concept:
domain:
forms:
  - text:
    status: preferred | accepted | contextual | avoid
    surfaces:
    audiences:
notes:
```

Rules:

- never invent Korean merely to avoid English
- never preserve English merely because source is English
- prefer established professional usage
- preserve acronyms when conventional
- formal first mention may use bilingual form
- project terminology overrides baseline

## 5. Register

Priority:

```text
explicit instruction
>
existing artifact
>
project
>
surface default
```

Registers:

- 해요체
- 합니다체
- 한다체
- phrase/no-ending

Never mix without a functional reason.

## 6. Surface policy requirements

Each surface pack should define:

- intended reader
- default register
- title style
- normal verbosity
- acceptable terminology mix
- surface-specific anti-patterns
- examples

## 7. Domain policy requirements

Each domain pack should define:

- specialist terms
- preferred Korean/English forms
- context-sensitive variants
- common mistranslations
- technical distinctions
- examples

Do not turn packs into tutorials.

## 8. Security terminology design

Security is intentionally first-class.

Important concept families:

### Offensive/security lifecycle

- initial access
- execution
- persistence
- privilege escalation
- defense evasion
- credential access
- discovery
- lateral movement
- collection
- command and control
- exfiltration
- impact

### AppSec/vulnerability

- exploit
- vulnerability
- payload
- injection
- XSS
- CSRF
- SSRF
- RCE
- LFI/RFI
- deserialization
- auth bypass
- privilege escalation
- remediation
- mitigation

### Identity/secrets

- credential
- secret
- token
- access key
- revoke
- rotate
- credential dumping

### Detection/DFIR

- IOC
- TTP
- artifact
- triage
- forensic image
- memory dump
- detection
- alert
- incident

Every Korean rendering needs evidence and context.

## 9. Generalization rule

Do not encode:

```text
세우다 -> 생성하다
```

Encode:

```text
When a technical object is being created/initialized/configured,
avoid a general metaphorical verb that Korean practitioners would
not normally use; choose the verb describing the actual operation.
```

Eval unseen examples to ensure transfer.
