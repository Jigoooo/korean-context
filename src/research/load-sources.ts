import { readFile } from "node:fs/promises";

import { parse } from "yaml";

import { SourceRecordSchema, type SourceRecord } from "./schema.js";

export async function loadSources(path: string): Promise<SourceRecord[]> {
  const contents = await readFile(path, "utf8");
  const sources = SourceRecordSchema.array().parse(parse(contents));
  const ids = new Set<string>();

  for (const source of sources) {
    if (ids.has(source.id)) {
      throw new Error(`Duplicate source id: ${source.id}`);
    }
    ids.add(source.id);
  }

  return sources;
}
