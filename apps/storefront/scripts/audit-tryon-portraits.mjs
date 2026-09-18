import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const rows = []
for (const dir of ["worn-victor", "worn-victor-male"]) {
  const folder = path.join(root, "public/tryon", dir)
  const files = await fs.readdir(folder)
  for (const file of files) {
    if (!file.endsWith(".jpg")) continue
    if (files.includes(file.replace(/\.jpg$/, "-portrait.jpg"))) continue
    const { width, height } = await sharp(path.join(folder, file)).metadata()
    if (Math.abs(width / height - 0.8) <= 0.04 && width >= 800 && height >= 1000) continue
    rows.push({ file: `${dir}/${file}`, width, height, priority: file.startsWith("sun-fendi-") ? 1 : 2 })
  }
}
rows.sort((a, b) => a.priority - b.priority || a.file.localeCompare(b.file))
const output = path.join(root, "tryon-portrait-audit.json")
await fs.writeFile(output, JSON.stringify(rows, null, 2) + "\n")
console.log(`${rows.length} images need portrait review; ${rows.filter(row => row.priority === 1).length} Fendi. Report: ${output}`)
