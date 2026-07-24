import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import axe from "axe-core";
import { JSDOM } from "jsdom";

const root = path.join(process.cwd(), "dist");
const htmlFiles = [];
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) htmlFiles.push(file);
  }
}

await walk(root);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: `https://esiivola.github.io/${path.relative(root, file)}`
  });
  dom.window.eval(axe.source);
  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]
    },
    rules: {
      "color-contrast": { enabled: false }
    }
  });
  for (const violation of results.violations) {
    failures.push(
      `${path.relative(root, file)}: ${violation.id} — ${violation.help} (${violation.nodes.length} node${violation.nodes.length === 1 ? "" : "s"})`
    );
  }
  dom.window.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Automated WCAG structure checks passed on ${htmlFiles.length} pages.`);
