import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository contract", () => {
  it("pins pnpm and supports the pnpm 11 Node floor", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      packageManager: string;
      engines: { node: string };
      private: boolean;
    };

    expect(pkg.private).toBe(true);
    expect(pkg.packageManager).toBe("pnpm@11.22.0");
    expect(pkg.engines.node).toBe(">=22.13");
  });

  it("excludes nested Git worktrees from test discovery", () => {
    const vitestConfig = readFileSync("vitest.config.ts", "utf8");

    expect(vitestConfig).toContain('"**/.worktrees/**"');
  });
});
