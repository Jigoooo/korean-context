# Infrastructure

## Audience

배포·운영·DevOps 담당자.

## Default register

선택한 surface의 register.

## Rules

- build, deploy, rollback, restore의 단계를 구분한다.
- image, container, digest, migration, observability 표기를 기존 시스템과 맞춘다.

## Avoid

rollback을 retry로 설명, application과 database 복구 범위 합치기.

## Examples

- `이전 image digest로 rollback한다. database migration은 별도로 복구한다.`
