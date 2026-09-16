// Generates a dramatic editorial "hero row" photo for each maison on the
// homepage brand banner — a moody, cinematically-lit 3/4 close-up of that
// brand's actual glasses on a distinct surface/setting, restaging the real
// studio product photo rather than inventing a new design.
//
// Requires GEMINI_API_KEY in the environment. Run from apps/storefront:
//   GEMINI_API_KEY=... node scripts/generate-brand-hero-photos.mjs
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(storefrontRoot, "../..");
const styleRefDir = path.join(repoRoot, "banner");
const outDir = path.join(storefrontRoot, "public/brand-hero");
fs.mkdirSync(outDir, { recursive: true });

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("Set GEMINI_API_KEY in the environment first.");
  process.exit(1);
}

const BRANDS = [
  { slug: "jacques-marie-mage", styleRef: "01_jacques_marie_mage.png" },
  { slug: "miu-miu", styleRef: "02_miu_miu.png" },
  { slug: "fendi", styleRef: "03_fendi.png" },
  { slug: "gucci", styleRef: "04_gucci.png" },
  { slug: "cartier", styleRef: "05_cartier.png" },
  { slug: "tom-ford", styleRef: "06_tom_ford.png" },
  { slug: "prada", styleRef: "07_prada.png" },
  { slug: "chrome-hearts", styleRef: "08_chrome_hearts.png" },
];

async function fetchBuffer(src) {
  const raw = await fs.promises.readFile(src);
  return sharp(raw).flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 95 }).toBuffer();
}

async function geminiEditImage({ styleRefImg }) {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: `This image is a low-resolution crop from a website mockup: a wide banner photo of sunglasses with some white text overlaid on the left and a thin sliver of an unrelated second image along the very bottom edge. Recreate it as a clean, sharp, high-resolution, photorealistic professional product photograph: keep the exact same sunglasses design, camera angle, composition, background setting, lighting mood and color grading — but render it at full sharp detail as if shot on a professional camera. Remove the text overlay completely and remove the sliver of the second image at the bottom edge, naturally extending the same background (matching material, lighting and blur) to fill that space seamlessly. Output a wide cinematic banner aspect ratio, no text, no watermark, no cropped artifacts — just the clean restaged photograph.`,
          },
          { inline_data: { mime_type: "image/png", data: styleRefImg.toString("base64") } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: "/v1beta/models/gemini-3-pro-image:generateContent?key=" + KEY,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 300)}`));
          try {
            const j = JSON.parse(d);
            const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
            if (!part) return reject(new Error("No image in response: " + d.slice(0, 300)));
            resolve(Buffer.from(part.inlineData.data, "base64"));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const only = process.argv.slice(2);
  const brands = only.length ? BRANDS.filter((b) => only.includes(b.slug)) : BRANDS;

  for (const b of brands) {
    const outPath = path.join(outDir, `${b.slug}.jpg`);
    if (fs.existsSync(outPath)) {
      console.log(`${b.slug} ... skip (exists)`);
      continue;
    }
    process.stdout.write(`${b.slug} ... `);
    try {
      const styleRefImg = await fs.promises.readFile(path.join(styleRefDir, b.styleRef));
      const result = await geminiEditImage({ styleRefImg });
      await fs.promises.writeFile(outPath, result);
      console.log("ok");
    } catch (err) {
      console.log("FAILED:", err.message);
    }
  }
}

main();
