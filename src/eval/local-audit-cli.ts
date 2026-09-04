import { runLocalAudit } from "./local-audit.js";
import { parseLocalAuditArguments } from "./local-suite.js";

try {
  const options = parseLocalAuditArguments(
    process.argv.slice(2),
    process.cwd(),
  );
  const summary = await runLocalAudit(options);
  console.log(
    `Completed ${summary.executed} local runs; skipped ${summary.skipped}; failed ${summary.failed}`,
  );
  if (summary.failed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
