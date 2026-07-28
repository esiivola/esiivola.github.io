import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "public", "generated-images");
const heroSource = "Eero-Siivola-1055-small.jpg";
const monogramSource = path.join(root, "public", "brand", "es_gfs_didot_b_cleaned.svg");

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

function brandMarkSvg({ maskable = false, monochrome = false } = {}) {
  const background = monochrome
    ? ""
    : `<rect width="512" height="512" rx="${maskable ? 0 : 104}" fill="#0B1721"/>`;
  const signal = monochrome ? "#000000" : "#78C8BD";
  const decision = monochrome ? "#000000" : "#F46A3B";
  const transform = maskable ? 'transform="translate(82 82) scale(.68)"' : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      ${background}
      <g ${transform}>
        <path d="M76 352C149 267 211 295 263 258C313 223 332 160 406 112"
          fill="none" stroke="${signal}" stroke-width="34" stroke-linecap="round"/>
        <path d="M78 414C163 336 235 367 296 324C337 295 355 266 378 226"
          fill="none" stroke="${signal}" stroke-width="24" stroke-linecap="round" opacity="${monochrome ? 1 : .62}"/>
        <circle cx="406" cy="112" r="34" fill="${decision}"/>
      </g>
    </svg>
  `;
}

function monogramTileSvg(monogramPath, { maskable = false } = {}) {
  const logoHeight = maskable ? 252 : 320;
  const scale = logoHeight / 1698;
  const logoWidth = 1517 * scale;
  const x = (512 - logoWidth) / 2;
  const y = (512 - logoHeight) / 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#0B1721"/>
      <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">
        ${monogramPath.replace('fill="#090a0c"', 'fill="#F4F1E8"')}
      </g>
    </svg>
  `;
}

function socialOverlay() {
  return Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="none"/>
      <path d="M704 0V630M0 112H1200M0 548H1200" fill="none" stroke="#0B1721" stroke-width="1" opacity=".2"/>
      <rect x="756" y="48" width="396" height="500" fill="none" stroke="#0B1721" stroke-width="2"/>
      <g fill="none" stroke="#0A6F6A" stroke-width="2" stroke-linecap="round" opacity=".25">
        <path d="M-30 455C134 382 270 391 397 457c96 50 180 50 273-4"/>
        <path d="M-50 505C112 438 260 442 401 501c96 40 185 37 282-13"/>
      </g>
      <path d="M526 492C570 465 606 425 648 364" fill="none" stroke="#0A6F6A" stroke-width="6" stroke-linecap="round"/>
      <circle cx="526" cy="492" r="10" fill="#F46A3B"/>
      <circle cx="648" cy="364" r="8" fill="#0A6F6A"/>
      <text x="140" y="72" fill="#0A6F6A" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="2">EERO SIIVOLA · HELSINKI</text>
      <text x="64" y="194" fill="#0B1721" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="600" letter-spacing="-2">
        <tspan x="72" dy="0">Uncertain data.</tspan>
        <tspan x="72" dy="74">Dependable systems.</tspan>
        <tspan x="72" dy="74">Better decisions.</tspan>
      </text>
      <text x="64" y="590" fill="#0B1721" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600">Data Scientist &amp; AI Architect</text>
      <text x="756" y="590" fill="#59636A" font-family="Arial, Helvetica, sans-serif" font-size="17" letter-spacing="1">PROBLEM FRAMING · MODELLING · DELIVERY</text>
    </svg>
  `);
}

async function createSocialCard() {
  const [portrait, monogram] = await Promise.all([
    sharp(path.join(root, heroSource))
      .rotate()
      .resize(396, 500, { fit: "cover", position: "attention" })
      .jpeg({ quality: 88 })
      .toBuffer(),
    sharp(monogramSource).resize({ height: 64 }).png().toBuffer()
  ]);

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: "#F4F1E8"
    }
  })
    .composite([
      { input: portrait, left: 756, top: 48 },
      { input: monogram, left: 64, top: 24 },
      { input: socialOverlay(), left: 0, top: 0 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", "og-share.png"));
}

function createIco(images) {
  const directory = Buffer.alloc(6 + images.length * 16);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(images.length, 4);

  let offset = directory.length;
  images.forEach(({ width, buffer }, index) => {
    const entry = 6 + index * 16;
    directory.writeUInt8(width >= 256 ? 0 : width, entry);
    directory.writeUInt8(width >= 256 ? 0 : width, entry + 1);
    directory.writeUInt8(0, entry + 2);
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(buffer.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += buffer.length;
  });

  return Buffer.concat([directory, ...images.map(({ buffer }) => buffer)]);
}

async function createBrandAssets() {
  const publicRoot = path.join(root, "public");
  const standardSvgSource = brandMarkSvg().trim();
  const standardSvg = Buffer.from(standardSvgSource);
  const monogramSvg = await readFile(monogramSource, "utf8");
  const monogramPath = monogramSvg.match(/<path[\s\S]*?\/>/)?.[0];
  if (!monogramPath) throw new Error("Monogram SVG does not contain a path");
  const monogramTile = Buffer.from(monogramTileSvg(monogramPath));
  const monogramMaskable = Buffer.from(monogramTileSvg(monogramPath, { maskable: true }));

  await Promise.all([
    writeFile(path.join(publicRoot, "favicon.svg"), `${standardSvgSource}\n`),
    writeFile(
      path.join(publicRoot, "safari-pinned-tab.svg"),
      monogramSvg.replace('fill="#090a0c"', 'fill="#000000"')
    )
  ]);

  const rasterSpecs = [
    ["favicon-16x16.png", 16, standardSvg],
    ["favicon-32x32.png", 32, standardSvg],
    ["apple-touch-icon.png", 180, monogramTile],
    ["icon-192.png", 192, monogramTile],
    ["icon-512.png", 512, monogramTile],
    ["icon-maskable-512.png", 512, monogramMaskable]
  ];

  await Promise.all(
    rasterSpecs.map(([name, size, input]) =>
      sharp(input)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(path.join(publicRoot, name))
    )
  );

  const icoImages = await Promise.all(
    [16, 32, 48].map(async (width) => ({
      width,
      buffer: await sharp(standardSvg).resize(width, width).png().toBuffer()
    }))
  );
  await writeFile(path.join(publicRoot, "favicon.ico"), createIco(icoImages));
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
    ["public/og-share.png", 1200, 630, "png", 1_000_000],
    ["public/favicon-16x16.png", 16, 16, "png", 25_000],
    ["public/favicon-32x32.png", 32, 32, "png", 25_000],
    ["public/apple-touch-icon.png", 180, 180, "png", 100_000],
    ["public/icon-192.png", 192, 192, "png", 100_000],
    ["public/icon-512.png", 512, 512, "png", 250_000],
    ["public/icon-maskable-512.png", 512, 512, "png", 250_000]
  ];

  await Promise.all(
    checks.map(([file, width, height, format, maxBytes]) =>
      verifyGeneratedImage(file, { width, height, format, maxBytes })
    )
  );

  const ico = await readFile(path.join(root, "public", "favicon.ico"));
  if (ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) !== 3) {
    throw new Error("Unexpected favicon.ico directory");
  }
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
await createBrandAssets();
await createSocialCard();
await verifyGeneratedImages();
await verifyOriginals();

console.log("Generated and checked responsive portraits and social preview; source files verified.");
