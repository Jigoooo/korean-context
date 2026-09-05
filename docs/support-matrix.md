# Support matrix

검사일: 2026-09-05

| Agent     | Verified version | Explicit skill | Implicit activation | Global | Project | Status          |
| --------- | ---------------- | -------------: | ------------------: | -----: | ------: | --------------- |
| Codex CLI | 0.147.0          |        100/100 |    v0.1 only: 30/30 |    Yes |     Yes | v0.2 prerelease |

v0.2 explicit은 `gpt-5.6-sol`, `xhigh`에서 평가했으며 hard failure 0으로 통과했습니다. implicit activation은 v0.2에서 다시 평가하지 않았습니다. v0.1 implicit은 30/30 실행됐지만 conflict 1건에서 요청한 산출물 대신 작업공간 설명을 반환했습니다.

Claude Code와 다른 agent는 아직 지원 대상으로 표시하지 않습니다.
