// Batch "model wearing these glasses" composites for the new portrait photo,
// reusing the same Gemini (Nano Banana Pro / gemini-3-pro-image) edit approach
// as generate-worn-composites.mjs, but starting from a single front photo
// (no real turntable sprite) — left/right poses are produced by asking the
// model to also turn the head slightly as part of the same edit.
//
// Requires GEMINI_API_KEY in the environment. Run from apps/storefront:
//   GEMINI_API_KEY=... node scripts/generate-victor-tryon.mjs [--limit N] [--poses front|left,front,right] [--portrait path] [--outdir name] [--pronoun her|his|their]
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(storefrontRoot, "../..");
const glassesDir = path.join(storefrontRoot, "public/images/sunglasses");

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("Set GEMINI_API_KEY in the environment first.");
  process.exit(1);
}

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : Infinity;
const posesArg = args.indexOf("--poses");
const POSE_IDS = posesArg >= 0 ? args[posesArg + 1].split(",") : ["left", "front", "right"];
const handlesArg = args.indexOf("--handles");
const ONLY_HANDLES = handlesArg >= 0 ? new Set(args[handlesArg + 1].split(",")) : null;
const forceArg = args.includes("--force");
const portraitArg = args.indexOf("--portrait");
const PORTRAIT_PATH = portraitArg >= 0
  ? path.resolve(repoRoot, args[portraitArg + 1])
  : path.join(repoRoot, "androgynous-portrait-black-shirt-natural-skin.png");
const outdirArg = args.indexOf("--outdir");
const outDir = path.join(storefrontRoot, "public/tryon", outdirArg >= 0 ? args[outdirArg + 1] : "worn-victor");
fs.mkdirSync(outDir, { recursive: true });
const pronounArg = args.indexOf("--pronoun");
const PRONOUN = pronounArg >= 0 ? args[pronounArg + 1] : "her";
const POSSESSIVE = PRONOUN === "his" ? "his" : PRONOUN === "their" ? "their" : "her";
const SUBJECT = PRONOUN === "his" ? "he" : PRONOUN === "their" ? "they" : "she";

const POSES = {
  left: { angleDeg: -30, turnNote: `turn ${POSSESSIVE} head slightly to ${SUBJECT === "they" ? "their" : SUBJECT === "he" ? "his" : "her"} right so we see a 3/4 left-facing angle` },
  front: { angleDeg: 0, turnNote: "keep the head facing forward, same angle as the original photo" },
  right: { angleDeg: 30, turnNote: `turn ${POSSESSIVE} head slightly to ${SUBJECT === "they" ? "their" : SUBJECT === "he" ? "his" : "her"} left so we see a 3/4 right-facing angle` },
};

async function fetchBuffer(src) {
  const raw = await fs.promises.readFile(src);
  return sharp(raw).flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 95 }).toBuffer();
}

async function geminiEditImage({ portraitImg, glassesImg, pose }) {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: `Image 1 is a portrait of a person. Image 2 shows a pair of glasses. Edit image 1 so the person is wearing the exact glasses shown in image 2, positioned naturally and correctly on their face. Also ${pose.turnNote}. The glasses must sit level and symmetric on the face: the frame's top edge should be parallel to the eyebrow line and both temples should sit at the exact same height above each ear — no tilt, no lean, no one side higher than the other. Keep the person's face, identity, expression, hair, skin tone, clothing, lighting and background completely unchanged — only add the glasses and adjust the head angle as instructed. Photorealistic, correct perspective and scale, natural shadow under the frame and on the skin, same photographic style as image 1.`,
          },
          { inline_data: { mime_type: "image/jpeg", data: portraitImg.toString("base64") } },
          { inline_data: { mime_type: "image/jpeg", data: glassesImg.toString("base64") } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "3:4" } },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: "/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + KEY,
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
  const portraitImg = await fetchBuffer(PORTRAIT_PATH);
  const files = fs
    .readdirSync(glassesDir)
    .filter((f) => f.endsWith(".jpg"))
    .filter((f) => !ONLY_HANDLES || ONLY_HANDLES.has(f.replace(/\.jpg$/, "")))
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`${files.length} glasses x ${POSE_IDS.length} poses = ${files.length * POSE_IDS.length} calls`);

  for (const file of files) {
    const handle = file.replace(/\.jpg$/, "");
    const glassesImg = await fetchBuffer(path.join(glassesDir, file));
    for (const poseId of POSE_IDS) {
      const pose = POSES[poseId];
      const outPath = path.join(outDir, `${handle}-${poseId}.jpg`);
      if (fs.existsSync(outPath) && !forceArg) {
        console.log(`${handle} / ${poseId} ... skip (exists)`);
        continue;
      }
      process.stdout.write(`${handle} / ${poseId} ... `);
      try {
        const result = await geminiEditImage({ portraitImg, glassesImg, pose });
        await fs.promises.writeFile(outPath, result);
        console.log("ok");
      } catch (err) {
        console.log("FAILED:", err.message);
      }
    }
  }
}

main();
