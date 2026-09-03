import { describe, expect, it } from "vitest";

import { validatePlugin } from "../../src/plugin/schema.js";

describe("plugin validator", () => {
  it("accepts the repository plugin", async () => {
    const result = await validatePlugin("plugins/korean-context");
    expect(result.errors).toEqual([]);
  });

  it("rejects a missing declared logo", async () => {
    const result = await validatePlugin("tests/fixtures/plugin-missing-logo");
    expect(result.errors).toContain(
      "interface.logo does not resolve inside the plugin",
    );
  });
});
