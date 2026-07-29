import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const roots = ["src", "public", "dist"];
const ignoredExtensions = new Set([".avif", ".webp", ".jpg", ".jpeg", ".png", ".ico"]);
const forbidden = [
  { label: "private filesystem path", pattern: /\/Users\/|\/home\//i },
  { label: "private source filename", pattern: /Vuono Group CV|cover_letter_vuono|One_pager_CV|CV - Eero Siivola/i },
  { label: "planning document", pattern: /EERO_SIIVOLA_SITE_PLAN|IMPLEMENTING_LLM_INSTRUCTIONS/i },
  { label: "email address", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "telephone link", pattern: /tel:/i },
  {
    label: "public CV route",
    pattern: /href\s*=\s*["'](?!data:|blob:|javascript:)[^"']*\/cv(?:\/|[?#]|(?=["']))/i
  }
];

export function findPrivacyViolations(text) {
  return forbidden.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label);
}

async function walk(directory, failures) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) {
      await walk(file, failures);
      continue;
    }
    if (ignoredExtensions.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, "utf8");
    for (const label of findPrivacyViolations(text)) {
      failures.push(`${label}: ${file}`);
    }
  }
}

async function main() {
  const failures = [];
  for (const root of roots) await walk(path.join(process.cwd(), root), failures);

  if (failures.length) {
    console.error([...new Set(failures)].join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("Privacy and publication-boundary scan passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
