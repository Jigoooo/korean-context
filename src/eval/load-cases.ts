import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { EvalCaseSchema, type EvalCase } from "./schema.js";
import { evalKinds } from "./types.js";

export async function loadEvalCases(directory: string): Promise<EvalCase[]> {
  const cases: EvalCase[] = [];
  const ids = new Set<string>();

  for (const kind of evalKinds) {
    const path = join(directory, `${kind}.jsonl`);
    const contents = await readFile(path, "utf8");
    const lines = contents.split(/\r?\n/u).filter((line) => line.trim() !== "");

    for (const [index, line] of lines.entries()) {
      let input: unknown;
      try {
        input = JSON.parse(line);
      } catch {
        throw new Error(`Invalid JSON at ${path}:${index + 1}`);
      }

      const evalCase = EvalCaseSchema.parse(input);
      if (evalCase.kind !== kind) {
        throw new Error(
          `Case ${evalCase.id} has kind ${evalCase.kind} in ${kind}.jsonl`,
        );
      }
      if (ids.has(evalCase.id)) {
        throw new Error(`Duplicate eval id: ${evalCase.id}`);
      }

      ids.add(evalCase.id);
      cases.push(evalCase);
    }
  }

  return cases;
}
