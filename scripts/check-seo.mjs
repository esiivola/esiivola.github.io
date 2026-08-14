import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = path.join(process.cwd(), "dist");
const siteUrl = "https://esiivola.github.io";
const socialImageUrl = `${siteUrl}/og-eero-siivola.png`;
const socialImageAlt =
  "Portrait of Eero Siivola with his name and role, Data Scientist & AI Architect.";
const htmlFiles = [];
const failures = [];
const titles = new Map();
const descriptions = new Map();

const requiredRoutes = ["/", "/about/", "/privacy/", "/research/", "/work/", "/writing/"];
const requiredGraphTypes = ["WebSite", "Person"];

async function walk(directory) {
  for (const entry of await readdir(directory)) {
    const file = path.join(directory, entry);
    const metadata = await stat(file);
    if (metadata.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) htmlFiles.push(file);
  }
}

function fail(file, message) {
  failures.push(`${path.relative(root, file)}: ${message}`);
}

function content(document, selector) {
  return document.querySelector(selector)?.getAttribute("content")?.trim() ?? "";
}

function duplicate(map, value, file, label) {
  if (!value) return;
  if (map.has(value)) fail(file, `duplicate ${label} also used by ${map.get(value)}`);
  else map.set(value, path.relative(root, file));
}

await walk(root);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const document = new JSDOM(html).window.document;
  const title = document.title.trim();
  const description = content(document, 'meta[name="description"]');
  const robots = content(document, 'meta[name="robots"]');
  const canonical = document.querySelector('link[rel="canonical"]')?.href ?? "";
  const noindex = robots.includes("noindex");

  if (!title) fail(file, "missing title");
  if (!description) fail(file, "missing meta description");
  if (!canonical.startsWith(`${siteUrl}/`)) fail(file, "canonical URL is missing or not absolute");
  if (!robots) fail(file, "missing robots directive");
  if (!content(document, 'meta[name="googlebot"]')) fail(file, "missing Googlebot directive");
  if (!content(document, 'meta[name="author"]')) fail(file, "missing author metadata");
  if (!document.querySelector('link[rel="alternate"][hreflang="en"]')) {
    fail(file, "missing English alternate URL");
  }
  if (!document.querySelector('link[rel="alternate"][hreflang="x-default"]')) {
    fail(file, "missing x-default alternate URL");
  }

  for (const selector of [
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[property="og:image:alt"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:alt"]'
  ]) {
    if (!content(document, selector)) fail(file, `missing ${selector}`);
  }

  const ogImage = content(document, 'meta[property="og:image"]');
  const secureOgImage = content(document, 'meta[property="og:image:secure_url"]');
  const twitterImage = content(document, 'meta[name="twitter:image"]');
  const ogImageAlt = content(document, 'meta[property="og:image:alt"]');
  const twitterImageAlt = content(document, 'meta[name="twitter:image:alt"]');
  if (ogImage !== socialImageUrl || secureOgImage !== socialImageUrl) {
    fail(file, "Open Graph image is not the current absolute social-card URL");
  }
  if (twitterImage !== socialImageUrl) {
    fail(file, "Twitter image does not match the Open Graph image");
  }
  if (ogImageAlt !== socialImageAlt || twitterImageAlt !== socialImageAlt) {
    fail(file, "social-card alternative text is missing or outdated");
  }

  for (const selector of [
    'link[rel="preload"][as="font"][href="/fonts/GFSDidot.otf"]',
    'link[rel="icon"][sizes="any"]',
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="icon"][sizes="16x16"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"][sizes="180x180"]',
    'link[rel="mask-icon"]',
    'link[rel="manifest"]'
  ]) {
    if (!document.querySelector(selector)) fail(file, `missing ${selector}`);
  }

  if (content(document, 'meta[name="theme-color"]') !== "#F4F1E8") {
    fail(file, "theme color does not match the site background");
  }

  const analyticsConsent = document.querySelector("[data-analytics-consent]");
  if (analyticsConsent?.getAttribute("data-analytics-id") !== "G-RK8VRLQ1ND") {
    fail(file, "analytics measurement ID is missing from the consent-controlled loader");
  }

  const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  if (schemaScripts.length !== 1) {
    fail(file, `expected one JSON-LD graph, found ${schemaScripts.length}`);
  } else {
    try {
      const schema = JSON.parse(schemaScripts[0].textContent ?? "");
      const graph = Array.isArray(schema["@graph"]) ? schema["@graph"] : [];
      const graphTypes = graph.flatMap((item) =>
        Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]]
      );
      for (const type of requiredGraphTypes) {
        if (!graphTypes.includes(type)) fail(file, `JSON-LD graph is missing ${type}`);
      }
      const page = graph.find((item) => item["@id"] === `${canonical}#webpage`);
      if (!page) fail(file, "JSON-LD graph is missing the canonical page entity");
      if (canonical.endsWith("/about/") && page?.["@type"] !== "ProfilePage") {
        fail(file, "About page is not marked as ProfilePage");
      }
    } catch (error) {
      fail(file, `invalid JSON-LD (${error.message})`);
    }
  }

  if (!noindex) {
    if (!robots.includes("index") || !robots.includes("follow")) {
      fail(file, "indexable page is missing index and follow directives");
    }
    duplicate(titles, title, file, "title");
    duplicate(descriptions, description, file, "description");
  }
}

const sitemap = await readFile(path.join(root, "sitemap-0.xml"), "utf8");
for (const route of requiredRoutes) {
  const absolute = new URL(route, siteUrl).href;
  if (!sitemap.includes(`<loc>${absolute}</loc>`)) {
    failures.push(`sitemap-0.xml: missing ${absolute}`);
  }
}
if (sitemap.includes("/404")) failures.push("sitemap-0.xml: 404 page must not be indexed");

const robots = await readFile(path.join(root, "robots.txt"), "utf8");
for (const directive of [
  "User-agent: OAI-SearchBot",
  "User-agent: PerplexityBot",
  `Sitemap: ${siteUrl}/sitemap-index.xml`
]) {
  if (!robots.includes(directive)) failures.push(`robots.txt: missing ${directive}`);
}

const llms = await readFile(path.join(root, "llms.txt"), "utf8");
if (!llms.startsWith("# Eero Siivola")) failures.push("llms.txt: missing required site heading");
for (const route of requiredRoutes) {
  const absolute = new URL(route, siteUrl).href;
  if (!llms.includes(absolute)) failures.push(`llms.txt: missing ${absolute}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "site.webmanifest"), "utf8"));
if (manifest.theme_color !== "#F4F1E8" || manifest.background_color !== "#F4F1E8") {
  failures.push("site.webmanifest: theme and background colors must match the site");
}
for (const icon of manifest.icons ?? []) {
  if (!icon.src?.startsWith("/")) {
    failures.push(`site.webmanifest: invalid icon source ${icon.src ?? "(missing)"}`);
    continue;
  }
  try {
    await stat(path.join(root, icon.src.slice(1)));
  } catch {
    failures.push(`site.webmanifest: missing icon file ${icon.src}`);
  }
}

for (const asset of [
  "brand/eero-siivola-wordmark.svg",
  "brand/es_gfs_didot_b_cleaned.svg",
  "fonts/GFSDidot.otf",
  "fonts/OFL.txt"
]) {
  try {
    await stat(path.join(root, asset));
  } catch {
    failures.push(`brand assets: missing ${asset}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`SEO checks passed on ${htmlFiles.length} pages, the sitemap, robots.txt, and llms.txt.`);
