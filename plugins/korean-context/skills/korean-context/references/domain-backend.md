# Backend

## Audience

서버·API 개발자와 운영자.

## Default register

선택한 surface의 register.

## Rules

- request, response, transaction, queue, retry, timeout의 방향과 조건을 보존한다.
- idempotency key는 중복 방지 식별자이며 암호화 key로 바꾸지 않는다.

## Avoid

enqueue/dequeue 방향 혼동, retry와 rollback 혼동.

## Examples

- `같은 idempotency key에는 기존 결과를 반환한다.`
