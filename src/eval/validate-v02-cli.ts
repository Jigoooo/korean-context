import { parseValidateV02Arguments, validateV02Suite } from "./validate-v02.js";

try {
  const summary = await validateV02Suite(
    parseValidateV02Arguments(process.argv.slice(2), process.cwd()),
  );
  console.log(
    `Validated v0.2 suite: ${summary.cases} cases, ${summary.repeated} repeated, privacy checks passed`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
