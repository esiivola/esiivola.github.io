import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = path.join(process.cwd(), "dist");
const htmlFiles = [];
const failures = [];

const characterRules = [
  { label: "em dash", pattern: /\u2014/u },
  { label: "en dash", pattern: /\u2013/u },
  { label: "right arrow", pattern: /\u2192/u },
  { label: "north-east arrow", pattern: /\u2197/u },
  { label: "emoji or pictograph", pattern: /\p{Extended_Pictographic}/u }
];

const proseRules = [
  {
    label: "staged contrast",
    pattern: /\b(?:not only|not just|it is not about|it is about|rather than)\b/i
  },
  {
    label: "formulaic setup",
    pattern:
      /\b(?:the (?:real |better )?question is|the answer is (?:clear|simple)|here is the catch|the guiding idea is simple)\b/i
  },
  {
    label: "stock transition",
    pattern:
      /\b(?:this is why|this is where|that is how|at its core|ultimately|overall|in summary|in conclusion|it is important to note|it is worth noting|with that in mind|against this backdrop|as we navigate)\b/i
  },
  {
    label: "generic scene-setting",
    pattern: /\b(?:in today's|in a world where|in an era of|at the intersection of)\b/i
  },
  {
    label: "inflated or promotional wording",
    pattern:
      /\b(?:pivotal|crucial|transformative|groundbreaking|underscores|showcases|serves as|stands as|testament|tapestry|realm|journey|roadmap|unlock|unleash|harness|elevate|empower|foster|pave the way|seamless|seamlessly|innovative|cutting-edge|leveraging|delve|dive into|multifaceted|remarkable|intricate)\b/i
  },
  {
    label: "generic portfolio introduction",
    pattern: /\b(?:a selection of|the sequence below)\b/i
  }
];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) htmlFiles.push(file);
  }
}

function renderedCopy(document) {
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script, style, svg, noscript").forEach((element) => element.remove());

  const metadata = [
    document.title,
    ...Array.from(document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]'))
      .map((element) => element.getAttribute("content") ?? "")
  ];
  const accessibleLabels = [
    ...Array.from(document.querySelectorAll("[alt], [aria-label], [title]"))
      .flatMap((element) => [
        element.getAttribute("alt") ?? "",
        element.getAttribute("aria-label") ?? "",
        element.getAttribute("title") ?? ""
      ])
  ];

  return [...metadata, body.textContent ?? "", ...accessibleLabels]
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function checkRules(file, text, rules) {
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) {
      failures.push(`${path.relative(process.cwd(), file)}: ${rule.label} (${JSON.stringify(match[0])})`);
    }
  }
}

await walk(root);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const dom = new JSDOM(html);
  const copy = renderedCopy(dom.window.document);
  checkRules(file, copy, characterRules);
  checkRules(file, copy, proseRules);
  dom.window.close();
}

const socialCardSource = path.join(process.cwd(), "scripts", "generate-images.mjs");
checkRules(socialCardSource, await readFile(socialCardSource, "utf8"), characterRules);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Language audit passed on ${htmlFiles.length} rendered pages and the social-card source.`);
