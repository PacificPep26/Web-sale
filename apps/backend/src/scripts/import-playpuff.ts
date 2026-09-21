import { readFile } from "node:fs/promises"
import type { ExecArgs } from "@medusajs/framework/types"
import { importToysWorkflow } from "../workflows/import-toys"

export default async function importPlaypuff({ container }: ExecArgs) {
  const file = process.env.PLAYPUFF_CATALOG_FILE
  if (!file) throw new Error("Set PLAYPUFF_CATALOG_FILE to the supplier catalog JSON. Default is dry-run; set PLAYPUFF_IMPORT_APPLY=true to write validated rows.")
  const rows: unknown = JSON.parse(await readFile(file, "utf8"))
  const { result } = await importToysWorkflow(container).run({ input: { rows, apply: process.env.PLAYPUFF_IMPORT_APPLY === "true" } })
  container.resolve("logger").info(JSON.stringify(result))
}
