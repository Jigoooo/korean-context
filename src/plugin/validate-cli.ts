import { validatePlugin } from "./schema.js";

const root = process.argv[2] ?? "plugins/korean-context";
const result = await validatePlugin(root);
if (result.errors.length > 0) {
  for (const error of result.errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Plugin validation passed: ${root}`);
}
