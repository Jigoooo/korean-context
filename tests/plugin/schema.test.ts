import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePlugin } from "../../src/plugin/schema.js";

describe("plugin schema validation", () => {
  it("accepts SemVer prerelease and build metadata together", async () => {
    const directory = await mkdtemp(join(tmpdir(), "korean-context-plugin-"));
    const root = join(directory, "sample");
    try {
      await mkdir(join(root, ".codex-plugin"), { recursive: true });
      await writeFile(
        join(root, ".codex-plugin", "plugin.json"),
        `${JSON.stringify({
          name: "sample",
          version: "0.2.0-rc.1+codex.local-20260904-084508",
        })}\n`,
        "utf8",
      );

      await expect(validatePlugin(root)).resolves.toEqual({ errors: [] });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
