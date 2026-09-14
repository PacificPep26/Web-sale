// One-off / re-runnable offline tool: proper ML background removal for
// glasses product photos, producing tightly-cropped transparent PNGs for
// the virtual try-on overlay. Run from apps/storefront:
//   node scripts/generate-cutouts.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(__dirname, "..");
const outDir = path.join(storefrontRoot, "public", "tryon", "cutouts");
fs.mkdirSync(outDir, { recursive: true });

function u(id) {
  return `https://images.unsplash.com/photo-${id}?w=1000&q=80`;
}

// slug -> source image (Unsplash id-based URL or a local file path)
const SOURCES = {
  "polarized-aviator-sunglasses": u("1511499767150-a48a237f0083"),
  "blue-light-filter-glasses": u("1574258495973-f010dfbb5371"),
  "round-retro-sunglasses": u("1508296695146-257a814070b4"),
  "sport-wrap-sunglasses": u("1577803645773-f96470509666"),
  "oversized-square-sunglasses": u("1473496169904-658ba7c44d8a"),
  "clubmaster-sunglasses": u("1574258495973-f010dfbb5371"),
  "cat-eye-sunglasses": u("1508296695146-257a814070b4"),
  "blue-light-reading-glasses": u("1577803645773-f96470509666"),
  "rimless-titanium-frames": u("1574258495973-f010dfbb5371"),
  "heritage-square-sunglasses": new Blob(
    [fs.readFileSync(path.join(storefrontRoot, "public/tryon/anh2-front-ai.jpg"))],
    { type: "image/jpeg" }
  ),
};

// a couple of source photos are shot at a dramatic angle; level them so the
// frame reads horizontally once composited onto the face.
const LEVEL_CORRECTION = {};

/**
 * Product photos often have an asymmetric bounding box after trim() (e.g. a
 * temple arm extending further on one side, or a resting-on-a-surface
 * angle) — so "center of the trimmed image" is NOT "center of the lenses".
 * This finds the lens band (the row range with the most opaque pixels —
 * temples are thin, the lens+bridge band is dense and wide) and its
 * horizontal centroid, then pads the canvas asymmetrically so that point
 * becomes the exact image center. Downstream compositing can then always
 * anchor on the plain image center.
 */
async function recenterOnLensBand(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const rowDensity = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x++) {
      sum += data[rowStart + x * channels + 3];
    }
    rowDensity[y] = sum;
  }

  const winH = Math.max(8, Math.round(height * 0.4));
  let windowSum = 0;
  for (let y = 0; y < Math.min(winH, height); y++) windowSum += rowDensity[y];
  let bestSum = windowSum;
  let bestStart = 0;
  for (let y = 1; y + winH <= height; y++) {
    windowSum += rowDensity[y + winH - 1] - rowDensity[y - 1];
    if (windowSum > bestSum) {
      bestSum = windowSum;
      bestStart = y;
    }
  }
  const bandEnd = Math.min(height, bestStart + winH);

  let sumX = 0;
  let sumAlpha = 0;
  for (let y = bestStart; y < bandEnd; y++) {
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x++) {
      const a = data[rowStart + x * channels + 3];
      sumX += x * a;
      sumAlpha += a;
    }
  }
  const anchorX = sumAlpha > 0 ? sumX / sumAlpha : width / 2;
  const anchorY = (bestStart + bandEnd) / 2;

  const newWidth = Math.round(2 * Math.max(anchorX, width - anchorX));
  const newHeight = Math.round(2 * Math.max(anchorY, height - anchorY));
  const padLeft = Math.round(newWidth / 2 - anchorX);
  const padTop = Math.round(newHeight / 2 - anchorY);

  return sharp(buffer)
    .ensureAlpha()
    .extend({
      top: padTop,
      bottom: newHeight - height - padTop,
      left: padLeft,
      right: newWidth - width - padLeft,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function main() {
  for (const [slug, src] of Object.entries(SOURCES)) {
    process.stdout.write(`cutting ${slug} ... `);
    try {
      const blob = await removeBackground(src);
      const rawCut = Buffer.from(await blob.arrayBuffer());
      let pipeline = sharp(rawCut).ensureAlpha();
      const correction = LEVEL_CORRECTION[slug];
      if (correction) {
        pipeline = pipeline.rotate(correction, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }
      const trimmed = await pipeline.trim({ threshold: 10 }).png().toBuffer();
      const recentered = await recenterOnLensBand(trimmed);
      const { width, height } = await sharp(recentered).metadata();
      await fs.promises.writeFile(path.join(outDir, `${slug}.png`), recentered);
      console.log(`ok (${width}x${height})`);
    } catch (err) {
      console.log("FAILED:", err.message);
    }
  }
}

main();
