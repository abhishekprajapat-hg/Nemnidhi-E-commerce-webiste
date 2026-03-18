import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const mobileRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(mobileRoot, "..");
const assetsDir = path.join(mobileRoot, "assets");
const sourceSvgPath = path.join(repoRoot, "frontend", "public", "favicon.svg");

const ICON_BG = "#F5EEE5";
const MONO_FILL = "#1F1915";
const CANVAS_SIZE = 1024;

const center = (canvasSize, elementSize) => Math.round((canvasSize - elementSize) / 2);

async function renderSvg(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

async function renderSquareIcon(svg, outputName, size = CANVAS_SIZE) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(assetsDir, outputName));
}

async function renderPaddedIcon(
  svg,
  outputName,
  innerSize,
  background = { r: 0, g: 0, b: 0, alpha: 0 }
) {
  const iconBuffer = await renderSvg(svg, innerSize);

  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: iconBuffer,
        left: center(CANVAS_SIZE, innerSize),
        top: center(CANVAS_SIZE, innerSize),
      },
    ])
    .png()
    .toFile(path.join(assetsDir, outputName));
}

async function renderSolidBackground(outputName, color) {
  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toFile(path.join(assetsDir, outputName));
}

const monoMarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M18 46V18h9l11 15V18h8v28h-9L26 31v15h-8z" fill="${MONO_FILL}" />
  <circle cx="48" cy="16" r="2.8" fill="${MONO_FILL}" />
</svg>
`;

const sourceSvg = await fs.readFile(sourceSvgPath, "utf8");

await fs.mkdir(assetsDir, { recursive: true });

await renderSquareIcon(sourceSvg, "icon.png");
await renderSquareIcon(sourceSvg, "favicon.png", 256);
await renderPaddedIcon(sourceSvg, "splash-icon.png", 420);
await renderPaddedIcon(sourceSvg, "android-icon-foreground.png", 700);
await renderPaddedIcon(monoMarkSvg, "android-icon-monochrome.png", 560);
await renderSolidBackground("android-icon-background.png", ICON_BG);

console.log("Brand assets generated in", assetsDir);
