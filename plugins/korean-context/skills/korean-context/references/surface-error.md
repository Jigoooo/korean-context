# Error

## Audience

실패에서 복구하려는 사용자 또는 운영자.

## Default register

제품 오류는 해요체, CLI는 기존 phrase convention을 따른다.

## Rules

- 원인과 영향은 입력에 있는 범위에서 직접 설명한다.
- 다음 행동은 prompt나 확인된 맥락이 제공할 때만 쓴다. 해결책이나 재시도 지시를 임의로 추가하지 않는다.
- secret, token 값, 내부 stack을 노출하지 않는다.

## Avoid

`오류가 발생했습니다`만 표시, 공격 성공 단정, 해결 불가능한 명령.

## Examples

- `요청을 확인할 수 없어요. 새로고침한 뒤 다시 시도해 주세요.`
