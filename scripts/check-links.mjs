import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "dist");
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) htmlFiles.push(file);
  }
}

function internalTarget(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return path.join(root, "index.html");
  const relative = clean.replace(/^\//, "");
  return path.extname(relative)
    ? path.join(root, relative)
    : path.join(root, relative, "index.html");
}

await walk(root);
const external = new Set();
const failures = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^https?:\/\//.test(href)) {
      const url = new URL(href);
      if (url.hostname === "esiivola.github.io") {
        try {
          await stat(internalTarget(url.pathname));
        } catch {
          failures.push(`${path.relative(root, file)} → ${href}`);
        }
        continue;
      }
      external.add(href);
      continue;
    }
    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const [route, fragment] = href.split("#");
    const target = route ? internalTarget(route) : file;
    try {
      await stat(target);
      if (fragment) {
        const targetHtml = await readFile(target, "utf8");
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (!new RegExp(`id=["']${escaped}["']`).test(targetHtml)) {
          failures.push(`${path.relative(root, file)} → missing #${fragment}`);
        }
      }
    } catch {
      failures.push(`${path.relative(root, file)} → ${href}`);
    }
  }
}

for (const href of external) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(href, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "EeroSiivolaSiteLinkCheck/1.0" }
    });
    const protectedEndpoint =
      response.status === 403 ||
      response.status === 405 ||
      (response.status === 999 && new URL(href).hostname.endsWith("linkedin.com"));
    if (response.status >= 400 && !protectedEndpoint) {
      failures.push(`${href} returned ${response.status}`);
    }
  } catch (error) {
    failures.push(`${href} could not be reached (${error.name})`);
  } finally {
    clearTimeout(timeout);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} pages and ${external.size} external URLs.`);
