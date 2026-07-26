import { createHash } from "node:crypto";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "public", "generated-images");
const heroSource = "Eero-Siivola-1055-small.jpg";

const originals = {
  "Eero-Siivola-1055-small.jpg": "1e86864c2410db28d53c7b8d84ffae8aa48694bd62b087001c6a39afdb2daa4d",
  "eero-03395.jpg": "abaa49c9b6387bfef1932177a841386ccf8766058e870b8a38630d46c5ce8b3c"
};

async function verifyOriginals() {
  for (const [name, expected] of Object.entries(originals)) {
    const buffer = await readFile(path.join(root, name));
    const actual = createHash("sha256").update(buffer).digest("hex");
    if (actual !== expected) {
      throw new Error(`Original portrait changed: ${name}`);
    }
  }
}

async function createPortraitSet({ source, stem, position = "centre" }) {
  const input = path.join(root, source);
  for (const width of [640, 900]) {
    const height = Math.round((width * 4) / 3);
    const pipeline = sharp(input)
      .rotate()
      .resize(width, height, {
        fit: "cover",
        position
      });

    await pipeline
      .clone()
      .avif({ quality: 64, effort: 6 })
      .toFile(path.join(output, `${stem}-${width}.avif`));
    await pipeline
      .clone()
      .webp({ quality: 80, effort: 5 })
      .toFile(path.join(output, `${stem}-${width}.webp`));

    if (width === 900) {
      await pipeline
        .clone()
        .jpeg({ quality: 84, progressive: true, mozjpeg: true })
        .toFile(path.join(output, `${stem}-${width}.jpg`));
    }
  }
}

function socialOverlay() {
  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="portraitFade" x1="0" x2="1">
          <stop offset="0" stop-color="#0B1721"/>
          <stop offset=".28" stop-color="#0B1721" stop-opacity=".86"/>
          <stop offset=".75" stop-color="#0B1721" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="none"/>
      <rect x="630" width="240" height="630" fill="url(#portraitFade)"/>
      <g fill="none" stroke="#78C8BD" stroke-width="2" stroke-linecap="round" opacity=".34">
        <path d="M-40 96C126 22 257 31 381 107c86 53 168 69 245 37"/>
        <path d="M-55 162C102 79 250 81 390 155c92 49 180 55 270 4"/>
        <path d="M-46 502C104 436 247 434 395 495c96 39 184 38 278-8"/>
        <path d="M-71 570C93 503 251 502 414 558c91 31 177 27 267-15"/>
      </g>
      <path d="M475 486C527 442 574 397 627 326" fill="none" stroke="#F46A3B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="475" cy="486" r="9" fill="#F46A3B"/>
      <circle cx="627" cy="326" r="7" fill="#78C8BD"/>
      <text x="72" y="88" fill="#78C8BD" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="2">EERO SIIVOLA · HELSINKI</text>
      <text x="72" y="203" fill="#F4F1E8" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="600" letter-spacing="-2">
        <tspan x="72" dy="0">Uncertain data.</tspan>
        <tspan x="72" dy="80">Dependable systems.</tspan>
        <tspan x="72" dy="80">Better decisions.</tspan>
      </text>
      <text x="72" y="560" fill="#F4F1E8" font-family="Arial, Helvetica, sans-serif" font-size="24">Data Scientist &amp; AI Architect</text>
    </svg>
  `);
}

async function createSocialCard() {
  const portrait = await sharp(path.join(root, heroSource))
    .rotate()
    .resize(570, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88 })
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: "#0B1721"
    }
  })
    .composite([
      { input: portrait, left: 630, top: 0 },
      { input: socialOverlay(), left: 0, top: 0 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", "og-industry.png"));
}

async function verifyGeneratedImage(file, expected) {
  const target = path.join(root, file);
  const [metadata, details] = await Promise.all([sharp(target).metadata(), stat(target)]);
  if (
    metadata.width !== expected.width ||
    metadata.height !== expected.height ||
    metadata.format !== expected.format
  ) {
    throw new Error(`Unexpected generated image metadata: ${file}`);
  }
  if (details.size > expected.maxBytes) {
    throw new Error(`Generated image exceeds size budget: ${file}`);
  }
}

async function verifyGeneratedImages() {
  const checks = [
    ["public/generated-images/eero-siivola-1055-hero-640.avif", 640, 853, "heif", 250_000],
    ["public/generated-images/eero-siivola-1055-hero-640.webp", 640, 853, "webp", 300_000],
    ["public/generated-images/eero-siivola-1055-hero-900.avif", 900, 1200, "heif", 400_000],
    ["public/generated-images/eero-siivola-1055-hero-900.webp", 900, 1200, "webp", 450_000],
    ["public/generated-images/eero-siivola-1055-hero-900.jpg", 900, 1200, "jpeg", 500_000],
    ["public/og-industry.png", 1200, 630, "png", 1_000_000]
  ];

  await Promise.all(
    checks.map(([file, width, height, format, maxBytes]) =>
      verifyGeneratedImage(file, { width, height, format, maxBytes })
    )
  );
}

await verifyOriginals();
await mkdir(output, { recursive: true });
await createPortraitSet({
  source: heroSource,
  stem: "eero-siivola-1055-hero",
  position: "centre"
});
await createPortraitSet({
  source: "eero-03395.jpg",
  stem: "eero-03395-about",
  position: "centre"
});
await createSocialCard();
await verifyGeneratedImages();
await verifyOriginals();

console.log("Generated and checked responsive portraits and social preview; source files verified.");
