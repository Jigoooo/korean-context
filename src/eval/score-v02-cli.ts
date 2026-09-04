import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { evaluateAutomaticChecks } from "./hard-failures.js";
import { loadV02Suite } from "./load-v02-suite.js";
import { effectiveV02Runs, loadV02Runs } from "./run-store.js";
import {
  evaluateV02ReleaseGate,
  loadV02Scores,
  parseScoreV02Arguments,
} from "./v02-score.js";

try {
  const options = parseScoreV02Arguments(process.argv.slice(2), process.cwd());
  const [{ cases }, baselineRaw, explicitRaw, v01Raw, scores] =
    await Promise.all([
      loadV02Suite(options.manifestPath),
      loadV02Runs(options.baselineRunsPath),
      loadV02Runs(options.explicitRunsPath),
      loadV02Runs(options.v01RegressionRunsPath),
      loadV02Scores(options.scoresPath),
    ]);
  const baselineRuns = effectiveV02Runs(baselineRaw);
  const explicitRuns = effectiveV02Runs(explicitRaw);
  const v01RegressionRuns = effectiveV02Runs(v01Raw);
  const casesById = new Map(cases.map((evalCase) => [evalCase.id, evalCase]));
  const automaticEvaluations = [...baselineRuns, ...explicitRuns].map((run) => {
    const evalCase = casesById.get(run.caseId);
    if (!evalCase) {
      throw new Error(`Run references unknown v0.2 case: ${run.caseId}`);
    }
    return evaluateAutomaticChecks(evalCase, run);
  });
  const result = evaluateV02ReleaseGate({
    cases,
    baselineRuns,
    explicitRuns,
    v01RegressionRuns,
    automaticEvaluations,
    scores,
  });
  const output = `${JSON.stringify(result, null, 2)}\n`;
  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, output, "utf8");
  console.log(output.trimEnd());
  if (!result.passed) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
