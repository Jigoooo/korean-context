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
});
