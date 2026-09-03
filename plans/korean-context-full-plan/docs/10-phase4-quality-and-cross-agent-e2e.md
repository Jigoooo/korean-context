# 10. Phase 4 — Quality and Cross-Agent E2E

## Goal

Ensure the product is consistent enough to release.

## 1. Expand language eval

Add:

- several hundred+ cases
- deep security cases
- cross-surface terminology
- long artifact context
- existing-register preservation
- mixed Korean/English
- code identifiers inside Korean
- natural-text preservation
- project convention conflict
- translationese transfer

## 2. Cross-agent matrix

Run the same representative artifact tasks through supported agents.

Record:

- naturalness score
- terminology score
- register consistency
- boundary violations
- technical meaning errors
- activation failures

Goal is not identical wording. Goal is equivalent policy quality.

## 3. Activation reliability

Test without explicitly mentioning Korean Context.

Scenarios:

- "PR 본문 작성해줘"
- "이 코드에 주석 추가해줘"
- "리뷰 코멘트 남겨줘"
- "README 업데이트해줘"
- "이 버튼 문구 바꿔줘"

## 4. Boundary reliability

Ensure normal chat is unaffected:

- architecture explanation
- coding Q&A
- progress update
- plan
- debugging conversation

## 5. Subagent/delegation

For agents supporting delegated work:

- main agent writes artifact
- subagent writes artifact
- parallel/delegated task writes artifact

Document limitations.

## 6. Installer E2E

For every adapter:

- fresh install
- update
- reinstall
- project/global
- existing config
- corrupted managed block repair
- uninstall
- unsupported version behavior

## 7. Performance

Measure:

- bridge token size
- average reference loads
- perceived generation latency
- number of additional tool/model calls
- installer duration only as implementation metric, not runtime

## 8. Release blockers

Do not release if:

- technical meaning corruption occurs in core eval
- security terms are systematically mistranslated
- assistant chat is frequently affected
- installer can overwrite unrelated user config
- support matrix claims unverified agents
