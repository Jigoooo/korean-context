import { loadEvalCases } from "./load-cases.js";

const casesDirectory = process.argv[2] ?? "evals/cases";

try {
  const cases = await loadEvalCases(casesDirectory);
  const liveCount = cases.filter((item) => item.live).length;
  console.log(`Validated ${cases.length} cases; live set ${liveCount}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
