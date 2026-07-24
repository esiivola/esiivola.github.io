import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const roots = ["src", "public", "dist"];
const ignoredExtensions = new Set([".avif", ".webp", ".jpg", ".jpeg", ".png", ".ico"]);
const forbidden = [
  { label: "private filesystem path", pattern: /\/Users\/|\/home\//i },
  { label: "private source filename", pattern: /Vuono Group CV|cover_letter_vuono|One_pager_CV|CV - Eero Siivola/i },
  { label: "planning document", pattern: /EERO_SIIVOLA_SITE_PLAN|IMPLEMENTING_LLM_INSTRUCTIONS/i },
  { label: "email address", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "telephone link", pattern: /tel:/i },
  { label: "public CV route", pattern: /href=["'][^"']*\/cv\/?/i }
];
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) {
      await walk(file);
      continue;
    }
    if (ignoredExtensions.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, "utf8");
    for (const rule of forbidden) {
      if (rule.pattern.test(text)) failures.push(`${rule.label}: ${file}`);
    }
  }
}

for (const root of roots) await walk(path.join(process.cwd(), root));

if (failures.length) {
  console.error([...new Set(failures)].join("\n"));
  process.exit(1);
}

console.log("Privacy and publication-boundary scan passed.");
