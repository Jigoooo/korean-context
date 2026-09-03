import { access, readFile } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

export type ValidationResult = { errors: string[] };

export async function validatePlugin(root: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const manifestPath = resolve(root, ".codex-plugin", "plugin.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
    string,
    unknown
  >;
  if (manifest.name !== basename(resolve(root)))
    errors.push("plugin name must match its folder");
  if (
    typeof manifest.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(manifest.version)
  )
    errors.push("version must be strict SemVer");
  const interfaceValue = manifest.interface as
    Record<string, unknown> | undefined;
  for (const key of ["logo", "logoDark", "composerIcon"]) {
    const value = interfaceValue?.[key];
    if (typeof value !== "string") continue;
    const target = resolve(root, value);
    if (!target.startsWith(`${resolve(root)}${sep}`)) {
      errors.push(`interface.${key} escapes the plugin root`);
      continue;
    }
    try {
      await access(target);
    } catch {
      errors.push(`interface.${key} does not resolve inside the plugin`);
    }
  }
  return { errors };
}
