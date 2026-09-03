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
