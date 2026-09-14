// Generates clean studio product photos for 10 original, brand-neutral
// luxury sunglasses concepts (each loosely evoking a different well-known
// design house's AESTHETIC — silhouette, material, color mood — without
// copying any specific trademarked design, logo, or brand name). Pure
// text-to-image via Gemini (Nano Banana Pro / gemini-3-pro-image).
//
// Requires GEMINI_API_KEY in the environment. Run from apps/storefront:
//   GEMINI_API_KEY=... node scripts/generate-luxury-eyewear.mjs
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(__dirname, "..");
const outDir = path.join(storefrontRoot, "public", "catalog");
fs.mkdirSync(outDir, { recursive: true });

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("Set GEMINI_API_KEY in the environment first.");
  process.exit(1);
}

// title, handle, one-line style brief (for the image prompt + PDP copy),
// price is fixed at 350 for every item per the brief.
export const LUXURY_PRODUCTS = [
  {
    handle: "sovereign-no-7",
    title: "Sovereign No. 7",
    style:
      "ornate vintage-artisan acetate frame in deep jewel-toned tortoiseshell, hand-engraved antique gold metal temple hardware and rivets, Parisian atelier craftsmanship feel",
  },
  {
    handle: "aria-geometric",
    title: "Aria Geometric",
    style:
      "minimal architectural cat-eye frame in brushed titanium, sharp triangular geometry, matte black with a polished silver edge, understated modern luxury",
  },
  {
    handle: "bexley-bold",
    title: "Bexley Bold",
    style:
      "thick glossy black square acetate frame, bold Hollywood-glam silhouette, subtle brushed gold metal accent on the temple hinge",
  },
  {
    handle: "capri-oversized",
    title: "Capri Oversized",
    style:
      "oversized round tortoiseshell acetate frame, warm honey-brown gradient, understated jet-set resort luxury",
  },
  {
    handle: "sterling-rebel",
    title: "Sterling Rebel",
    style:
      "gothic sterling-silver metal frame with ornate engraved scrollwork hardware, black leather-wrapped temple tips, biker-luxury rock-and-roll aesthetic",
  },
  {
    handle: "aurelia-gold",
    title: "Aurelia Gold",
    style:
      "thin 18k-gold-tone wire aviator frame, subtle hand-engraved texture along the brow bar, refined jewelry-like precision",
  },
  {
    handle: "roma-vivid",
    title: "Roma Vivid",
    style:
      "bold oversized two-tone acetate frame in vivid emerald-green fading to black, playful confident Italian luxury",
  },
  {
    handle: "lumiere-crystal",
    title: "Lumière Crystal",
    style:
      "soft pastel-pink cat-eye acetate frame embellished with small clear crystal accents along the upper rim, romantic feminine luxury",
  },
  {
    handle: "monarch-square",
    title: "Monarch Square",
    style:
      "bold square acetate frame in rich chestnut tortoiseshell, polished gold double-bridge detail, confident executive luxury",
  },
  {
    handle: "palazzo-cat-eye",
    title: "Palazzo Cat-Eye",
    style:
      "retro cat-eye acetate frame in warm amber-and-cream marble pattern, sculptural upswept corners, glamorous Italian resort feel",
  },
];

async function geminiGenerateImage(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
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
  const items = LUXURY_PRODUCTS.filter(
    (p) => onlyHandles.length === 0 || onlyHandles.includes(p.handle)
  );

  for (const item of items) {
    const prompt = `Generate a professional e-commerce product photo of a pair of sunglasses: ${item.style}. Shot from a perfectly straight-on front view (camera at eye level, no angle), the glasses fully open, centered and symmetric, floating on a plain pure white seamless background, soft even studio lighting, subtle natural shadow directly beneath. Sharp focus, high detail on the materials and hardware. This is an original, non-branded design — no logos, no text, no wordmarks anywhere on the frame or lenses. Photorealistic.`;
    const outPath = path.join(outDir, `${item.handle}.jpg`);
    process.stdout.write(`${item.handle} ... `);
    try {
      const result = await geminiGenerateImage(prompt);
      await fs.promises.writeFile(outPath, result);
      console.log("ok");
    } catch (err) {
      console.log("FAILED:", err.message);
    }
  }
}

main();
