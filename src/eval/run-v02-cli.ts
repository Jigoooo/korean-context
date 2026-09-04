import { parseRunV02Arguments, runV02Evaluation } from "./run-v02.js";

try {
  const options = parseRunV02Arguments(process.argv.slice(2), process.cwd());
  const summary = await runV02Evaluation(options);
  console.log(
    `Completed ${summary.executed} runs; skipped ${summary.skipped}; failed ${summary.failed}`,
  );
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
