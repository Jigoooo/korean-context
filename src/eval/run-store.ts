import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { V02EvalRunSchema, type V02EvalRun } from "./v02-result-schema.js";

const writeQueues = new Map<string, Promise<void>>();

export function v02RunKey(
  run: Pick<V02EvalRun, "suite" | "caseId" | "mode" | "attempt">,
): string {
  return JSON.stringify([run.suite, run.caseId, run.mode, run.attempt]);
}

export async function loadV02Runs(path: string): Promise<V02EvalRun[]> {
  let contents;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const runs: V02EvalRun[] = [];
  for (const [index, line] of contents.split(/\r?\n/u).entries()) {
    if (line.trim() === "") {
      continue;
    }
    let input: unknown;
    try {
      input = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON at ${path}:${index + 1}`);
    }
    try {
      runs.push(V02EvalRunSchema.parse(input));
    } catch {
      throw new Error(`Invalid run at ${path}:${index + 1}`);
    }
  }
  return runs;
}

export function effectiveV02Runs(runs: V02EvalRun[]): V02EvalRun[] {
  const latest = new Map<string, V02EvalRun>();
  for (const run of runs) {
    latest.set(v02RunKey(run), run);
  }
  return [...latest.values()];
}

export function successfulV02RunKeys(runs: V02EvalRun[]): Set<string> {
  return new Set(
    effectiveV02Runs(runs)
      .filter(
        (run) =>
          run.status === "completed" &&
          run.exitCode === 0 &&
          run.output.trim() !== "",
      )
      .map(v02RunKey),
  );
}

export async function appendV02Run(
  path: string,
  run: V02EvalRun,
): Promise<void> {
  const validatedRun = V02EvalRunSchema.parse(run);
  const resolvedPath = resolve(path);
  const previous = writeQueues.get(resolvedPath) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      await mkdir(dirname(resolvedPath), { recursive: true });
      await appendFile(
        resolvedPath,
        `${JSON.stringify(validatedRun)}\n`,
        "utf8",
      );
    });
  writeQueues.set(resolvedPath, next);

  try {
    await next;
  } finally {
    if (writeQueues.get(resolvedPath) === next) {
      writeQueues.delete(resolvedPath);
    }
  }
}
