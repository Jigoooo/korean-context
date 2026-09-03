# Architecture

Korean Context는 plugin package, shared language source, evaluation harness로 나뉩니다.

```text
Codex request
  -> artifact boundary
  -> one surface reference
  -> optional one domain reference
  -> same-generation meaning and register check
  -> artifact
```

`plugins/korean-context/skills/korean-context`가 언어 정책의 single source of truth입니다. adapter별 정책 복사본, runtime database, network lookup, background model은 없습니다.

TypeScript 코드는 배포 runtime이 아니라 manifest, research metadata, case distribution, actual-run result를 검증하는 개발 도구입니다.
