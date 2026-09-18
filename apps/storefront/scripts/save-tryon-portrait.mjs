import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const [source, relative] = process.argv.slice(2)
if (!source || !/^(worn-victor|worn-victor-male)\/sun-[a-z0-9-]+-(front|left|right)\.jpg$/.test(relative ?? "")) {
  throw new Error("Usage: node scripts/save-tryon-portrait.mjs SOURCE worn-victor/sun-HANDLE-POSE.jpg")
}
const { width, height } = await sharp(source).metadata()
if (Math.abs(width / height - 0.8) > 0.04 || width < 800 || height < 1000) {
  throw new Error(`Invalid portrait ${width}x${height}; expected 4:5, at least 800x1000`)
}
const url = `/tryon/${relative.replace(/\.jpg$/, "-portrait.jpg")}`
const destination = path.join(root, "public", url)
const temporary = `${destination}.tmp`
await sharp(source).rotate().jpeg({ quality: 95 }).toFile(temporary)
await sharp(temporary).stats()
await fs.rename(temporary, destination)

// Publish only complete, validated files. Interrupted saves leave the old URL active.
const manifestPath = path.join(root, "lib/tryon-portraits.json")
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"))
manifest[`/tryon/${relative}`] = url
await fs.writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + "\n")
await fs.rename(`${manifestPath}.tmp`, manifestPath)
console.log(`Saved ${relative}: ${width}x${height}; ${Object.keys(manifest).length}/90 Fendi portraits ready`)
