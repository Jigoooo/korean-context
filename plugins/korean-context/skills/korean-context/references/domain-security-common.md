# Common security

## Audience

개발자, 보안 담당자, 제품 사용자.

## Default register

선택한 surface의 register.

## Rules

- authentication(인증)과 authorization(인가)을 구분한다.
- credential, secret, token, access key의 대상을 보존한다.
- rotate, revoke, delete의 결과를 구분한다.

## Avoid

credential을 항상 비밀번호로 축소, token 폐기를 계정 삭제로 표현.

## Examples

- `유출된 secret을 교체하고 기존 token을 폐기한다.`
