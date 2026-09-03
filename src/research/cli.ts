import { loadSources } from "./load-sources.js";

const sourcePath = process.argv[2] ?? "research/sources.yml";

try {
  const sources = await loadSources(sourcePath);
  const categories = new Map<string, number>();

  for (const source of sources) {
    categories.set(source.category, (categories.get(source.category) ?? 0) + 1);
  }

  const counts = [...categories.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => `${category}=${count}`)
    .join(", ");

  console.log(`Validated ${sources.length} research sources (${counts})`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
