import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const envPath = resolve(root, "apps/storefront/.env.local")
const channels = ["Cases", "Eyewear", "Toys", "Watches"]

let contents = readFileSync(envPath, "utf8")

function databaseKey(channel) {
  const query = `
    select a.token
    from api_key a
    join publishable_api_key_sales_channel l
      on l.publishable_key_id = a.id and l.deleted_at is null
    join sales_channel s
      on s.id = l.sales_channel_id and s.deleted_at is null
    where a.deleted_at is null
      and a.revoked_at is null
      and a.type = 'publishable'
      and s.name = '${channel}'
    limit 1;
  `

  return execFileSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-U", "medusa", "-d", "medusa", "-tA", "-c", query],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  ).trim()
}

function setVariable(name, value) {
  const entry = `${name}=${value}`
  const pattern = new RegExp(`^${name}=.*$`, "m")
  contents = pattern.test(contents)
    ? contents.replace(pattern, entry)
    : `${contents.trimEnd()}\n${entry}\n`
}

for (const channel of channels) {
  const key = databaseKey(channel)
  if (!key) throw new Error(`No active publishable key found for ${channel}`)
  setVariable(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_${channel.toUpperCase()}`, key)
}

setVariable("SITE", "eyewear")
setVariable("MEDUSA_BACKEND_URL", "http://localhost:9000")
setVariable("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "http://localhost:9000")

writeFileSync(envPath, contents, "utf8")
console.log("Synced local storefront publishable keys for Cases, Eyewear, Toys, and Watches.")
