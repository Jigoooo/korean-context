import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const root = "plugins/korean-context/skills/korean-context/references";
const expectedReferenceNames = [
  "surface-commit.md",
  "surface-pr.md",
  "surface-issue.md",
  "surface-review.md",
  "surface-comment.md",
  "surface-docs.md",
  "surface-ui.md",
  "surface-error.md",
  "surface-test.md",
  "surface-release.md",
  "domain-software.md",
  "domain-frontend.md",
  "domain-backend.md",
  "domain-infra.md",
  "domain-security-common.md",
  "domain-security-appsec.md",
  "domain-security-vulnerability.md",
  "domain-security-pentest-redteam.md",
];

describe("reference packs", () => {
  it.each(expectedReferenceNames)("%s has the required contract", (name) => {
    const content = readFileSync(`${root}/${name}`, "utf8");

    expect(content).toContain("## Audience");
    expect(content).toContain("## Default register");
    expect(content).toContain("## Rules");
    expect(content).toContain("## Avoid");
    expect(content).toContain("## Examples");
    expect(content.length).toBeLessThanOrEqual(6_000);
  });

  it("treats user-stated issue format as sufficient context", () => {
    const issue = readFileSync(`${root}/surface-issue.md`, "utf8");

    expect(issue).toContain(
      "사용자가 말한 프로젝트 형식과 알려진 사실은 충분한 맥락으로 취급한다.",
    );
    expect(issue).toContain(
      "템플릿 파일을 확인하거나 추가 자료를 요청하지 않는다.",
    );
    expect(issue).toContain(
      "한 항목을 요청하면 `- <항목>: <알려진 사실>` 형태로 쓴다.",
    );
    expect(issue).toContain(
      "빈 placeholder, 대괄호 안내, 값이 없는 colon을 추가하지 않는다.",
    );
  });
});

it("preserves English code identifiers in source comments", () => {
  const comment = readFileSync(`${root}/surface-comment.md`, "utf8");
  const terminology = readFileSync(`${root}/core-terminology.md`, "utf8");

  expect(comment).toContain("`node`를 `노드`로 음역하지 않는다.");
  expect(terminology).toContain(
    "영문 코드 식별자는 익숙한 한국어 음역이 있어도 글자 단위로 보존한다.",
  );
});

it("keeps English technical labels in commit subjects", () => {
  const commit = readFileSync(`${root}/surface-commit.md`, "utf8");

  expect(commit).toContain(
    "`canvas`를 `캔버스`, `sidebar`를 `사이드바`로 음역하지 않는다.",
  );
  expect(commit).toContain("sidebar 너비를 제외한 canvas 중앙 영역 계산 보정");
});

it("applies workspace vocabulary before preserving comment identifiers", () => {
  const comment = readFileSync(`${root}/surface-comment.md`, "utf8");

  expect(comment).toContain(
    "workspace 용어 매핑이 있으면 영문 식별자 보존보다 해당 매핑을 우선한다.",
  );
  expect(comment).toContain(
    "`// 드로어가 닫히면 선택한 widget을 비운다.`보다 `// 서랍이 닫히면 선택한 위젯을 비운다.`",
  );
});

it("keeps reconnect semantics distinct from creation", () => {
  const comment = readFileSync(`${root}/surface-comment.md`, "utf8");

  expect(comment).toContain(
    "기존 대상의 재연결을 새 대상 생성으로 바꾸지 않는다.",
  );
  expect(comment).toContain(
    "`// canvas 교체 후 WebGL context를 다시 연결한다.`",
  );
});

it("preserves English technical labels in developer copy and tables", () => {
  const ui = readFileSync(`${root}/surface-ui.md`, "utf8");
  const docs = readFileSync(`${root}/surface-docs.md`, "utf8");

  expect(ui).toContain(
    "개발자 도구 상태 문구의 영문 기술 표기는 글자 단위로 보존한다.",
  );
  expect(docs).toContain(
    "기술 표의 영문 기술 대상은 보존하되 동작 용어는 프로젝트가 허용한 형태를 사용한다.",
  );
  expect(docs).toContain("| WebGL | canvas 렌더링 |");
});
