# Application security

## Audience

AppSec 담당자와 application 개발자.

## Default register

선택한 surface의 register.

## Rules

- XSS, CSRF, SSRF, RCE, SQL Injection, auth bypass를 다른 취약점과 혼동하지 않는다.
- 가능성, 확인된 영향, 실제 악용을 구분한다.

## Avoid

RCE를 단순 실행 오류로 번역, 입력 검증과 인증을 같은 문제로 설명.

## Examples

- `이 취약점으로 원격 코드 실행이 가능하다.`
