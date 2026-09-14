// Generates photorealistic "model wearing these glasses" composites with
// Gemini (Nano Banana Pro / gemini-3-pro-image), one per product per
// face-visible turntable pose, by editing the same base model photo.
// Poses come from lib/tryon-poses.json — the single shared source of truth
// also used by the storefront components (TryOnModal.tsx / ProductDetails.tsx)
// so the generated files and the runtime lookup always agree.
//
// Requires GEMINI_API_KEY in the environment. Run from apps/storefront:
//   GEMINI_API_KEY=... node scripts/generate-worn-composites.mjs [handle...]
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import poses from "../lib/tryon-poses.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(__dirname, "..");
const outDir = path.join(storefrontRoot, "public", "tryon", "worn");
fs.mkdirSync(outDir, { recursive: true });

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("Set GEMINI_API_KEY in the environment first.");
  process.exit(1);
}

function u(id) {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80`;
}

// slug -> one or more reference photos of the glasses (does not need to be
// background-removed). A single source only shows the AI one viewpoint, so
// at wide turntable angles (±60/±90) it has to *infer* temple/side geometry
// it has never actually seen — pass an array (front + a side/angle shot)
// wherever more than one real photo of the same physical pair exists, so
// those extreme poses are grounded in real reference instead of a guess.
const GLASSES_SOURCES = {
  "polarized-aviator-sunglasses": u("1511499767150-a48a237f0083"),
  "blue-light-filter-glasses": u("1574258495973-f010dfbb5371"),
  "round-retro-sunglasses": u("1508296695146-257a814070b4"),
  "sport-wrap-sunglasses": u("1577803645773-f96470509666"),
  "oversized-square-sunglasses": u("1473496169904-658ba7c44d8a"),
  "clubmaster-sunglasses": u("1574258495973-f010dfbb5371"),
  "cat-eye-sunglasses": u("1508296695146-257a814070b4"),
  "blue-light-reading-glasses": u("1577803645773-f96470509666"),
  "rimless-titanium-frames": u("1574258495973-f010dfbb5371"),
  "heritage-square-sunglasses": [
    path.join(storefrontRoot, "public/tryon/anh2-front-ai.jpg"), // clean AI front reference
    path.join(storefrontRoot, "public/tryon/frame-01-side.png"), // real photo, shows temple/side geometry
  ],
};

async function fetchBuffer(src) {
  const raw = await (src.startsWith("http")
    ? new Promise((resolve, reject) => {
        https
          .get(src, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${src}`));
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => resolve(Buffer.concat(chunks)));
          })
          .on("error", reject);
      })
    : fs.promises.readFile(src));
  // normalize every reference to flattened JPEG — some sources are PNG with
  // transparency, which would otherwise render as black in a JPEG-tagged part
  return sharp(raw).flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 95 }).toBuffer();
}

async function geminiEditImage({ poseImg, glassesImages, angleDeg }) {
  const refNote =
    glassesImages.length > 1
      ? `Images 2-${glassesImages.length + 1} show the SAME physical pair of glasses from different angles — use all of them together to understand the true 3D shape of the frame and temples (not just one flat view), especially the temple/arm design, so the glasses look geometrically correct and consistent from any angle.`
      : "Image 2 shows the glasses.";
  const angleNote =
    Math.abs(angleDeg) >= 60
      ? " This is a wide turn/profile angle — infer the temple's true length, thickness and hinge position from the reference so it reads as a real continuous piece of eyewear, not a flat sticker glued on."
      : "";

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: `Image 1 is a portrait of a woman. ${refNote} Edit image 1 so the woman is wearing the exact glasses shown, positioned naturally and correctly on her face at the same head angle as image 1.${angleNote} The glasses must sit level and symmetric on her face: the frame's top edge should be parallel to her eyebrow line and both temples should sit at the exact same height above each ear — no tilt, no lean, no one side higher than the other. Keep her face, expression, hair, skin, pose, head angle, lighting, background and everything else in image 1 completely unchanged — only add the glasses. Photorealistic, correct perspective and scale, natural shadow under the frame and on the skin, same photographic style as image 1.`,
          },
          { inline_data: { mime_type: "image/jpeg", data: poseImg.toString("base64") } },
          ...glassesImages.map((img) => ({
            inline_data: { mime_type: "image/jpeg", data: img.toString("base64") },
          })),
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
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
  const onlyHandles = process.argv.slice(2);
  const entries = Object.entries(GLASSES_SOURCES).filter(
    ([slug]) => onlyHandles.length === 0 || onlyHandles.includes(slug)
  );

  const modelSpritePath = path.join(storefrontRoot, "public/tryon/model-face.jpg");
  const poseImages = {};
  for (const pose of poses) {
    poseImages[pose.id] = await sharp(modelSpritePath)
      .extract({ left: pose.cellX, top: pose.cellY, width: 300, height: 375 })
      .resize(600, 750)
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  for (const [slug, src] of entries) {
    const sources = Array.isArray(src) ? src : [src];
    const glassesImages = await Promise.all(sources.map(fetchBuffer));
    for (const pose of poses) {
      const outPath = path.join(outDir, `${slug}-${pose.id}.jpg`);
      process.stdout.write(`${slug} / ${pose.id} (${glassesImages.length} ref) ... `);
      try {
        const result = await geminiEditImage({
          poseImg: poseImages[pose.id],
          glassesImages,
          angleDeg: pose.angleDeg,
        });
        await fs.promises.writeFile(outPath, result);
        console.log("ok");
      } catch (err) {
        console.log("FAILED:", err.message);
      }
    }
  }
}

main();
