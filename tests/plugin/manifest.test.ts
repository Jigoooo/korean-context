import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("plugin manifest", () => {
  it("describes the v0.1 skills-only plugin", () => {
    const manifest = JSON.parse(
      readFileSync("plugins/korean-context/.codex-plugin/plugin.json", "utf8"),
    ) as Record<string, unknown>;

    expect(manifest.name).toBe("korean-context");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.license).toBe("MIT");
    expect(manifest).not.toHaveProperty("mcpServers");
    expect(manifest).not.toHaveProperty("apps");
    expect(manifest).not.toHaveProperty("hooks");
  });
});
