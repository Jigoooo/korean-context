import { readFile } from "node:fs/promises";

import { EvalScoreSchema, summarizeScores } from "./score.js";

const scorePaths = process.argv
  .slice(2)
  .filter((value) => !value.startsWith("-"));
if (scorePaths.length === 0) {
  throw new Error("Pass one or more score JSONL paths");
}

const scores = [];
for (const path of scorePaths) {
  const contents = await readFile(path, "utf8");
  for (const line of contents.split(/\r?\n/u).filter(Boolean)) {
    scores.push(EvalScoreSchema.parse(JSON.parse(line)));
  }
}

console.log(JSON.stringify(summarizeScores(scores), null, 2));
