import { test, expect } from "@playwright/test"
import sharp from "sharp"
import { normalizeSearchImage, searchImage, readLimitedBody } from "../lib/image-search"
import { POST } from "../app/api/image-search/route"
import { createImageSearchLimiter } from "../lib/image-search-limits"

test("photo quotas enforce minute and daily limits and reset at UTC midnight", () => {
  const limiter = createImageSearchLimiter({ IMAGE_SEARCH_PER_IP_MINUTE: "2", IMAGE_SEARCH_PER_IP_DAY: "3", IMAGE_SEARCH_DAILY_LIMIT: "4" })
  const run = (ip: string, now: number) => {
    const permit = limiter.acquire(ip, now)
    if (permit.allowed) permit.release()
    return permit
  }
  expect(run("a", 0).allowed).toBe(true)
  expect(run("a", 0).allowed).toBe(true)
  expect(run("a", 0)).toMatchObject({ allowed: false, retryAfter: 60 })
  expect(run("a", 60_000).allowed).toBe(true)
  expect(run("a", 120_000)).toMatchObject({ allowed: false, retryAfter: 86280 })
  expect(run("b", 120_000).allowed).toBe(true)
  expect(run("c", 120_000).allowed).toBe(false)
  expect(run("a", 86_400_000).allowed).toBe(true)
})

test("photo quotas reserve capacity before concurrent work and release only once", () => {
  const limiter = createImageSearchLimiter({ IMAGE_SEARCH_DAILY_LIMIT: "3" })
  const first = limiter.acquire("a", 0)
  const second = limiter.acquire("b", 0)
  expect(first.allowed && second.allowed).toBe(true)
  expect(limiter.acquire("c", 0).allowed).toBe(false)
  if (first.allowed) { first.release(); first.release() }
  expect(limiter.acquire("c", 0).allowed).toBe(true)
  if (second.allowed) second.release()
  expect(limiter.acquire("d", 0).allowed).toBe(false)
})

const thumbnail = "/images/eyewear/sun-cartier-c-allonge-de-cartier.jpg"
const product = { id: "prod_photo_test", title: "Photo test frames", handle: "photo-test-frames", thumbnail }

async function fixtureImage() {
  return sharp({ create: { width: 40, height: 30, channels: 3, background: "#336699" } }).png().toBuffer()
}

test("photo search validates bytes and strips metadata while resizing", async () => {
  const bytes = await sharp({ create: { width: 1600, height: 800, channels: 3, background: "white" } }).jpeg().withMetadata().toBuffer()
  const normalized = await normalizeSearchImage(bytes)
  expect("inlineData" in normalized).toBeTruthy()
  if ("inlineData" in normalized) {
    const metadata = await sharp(Buffer.from(normalized.inlineData.data, "base64")).metadata()
    expect(metadata.width).toBe(1024)
    expect(metadata.exif).toBeUndefined()
  }
  await expect(normalizeSearchImage(Buffer.from("not an image"))).rejects.toThrow("valid JPG")
  await expect(readLimitedBody(new Response("too large").body, 3)).rejects.toThrow("smaller than 5 MB")
})

test("Gemini results are visually verified, deduplicated and restricted to real catalog IDs", async () => {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = "test-only-key"
  let geminiCalls = 0
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/store/products")) {
      expect(new Headers(init?.headers).has("x-publishable-api-key")).toBeTruthy()
      return Response.json({ products: [product], count: 1 })
    }
    geminiCalls++
    const body = JSON.parse(String(init?.body))
    if (geminiCalls === 2) {
      expect(body.contents[0].parts.filter((part: { inlineData?: unknown }) => part.inlineData)).toHaveLength(2)
    }
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({
      description: "Possible frames", matches: [{ id: product.id, confidence: 0.96 }, { id: product.id, confidence: 0.95 }, { id: "invented", confidence: 1 }],
    }) }] } }] })
  }
  try {
    const result = await searchImage(await normalizeSearchImage(await fixtureImage()), AbortSignal.timeout(10_000))
    expect(geminiCalls).toBe(2)
    expect(result.products).toEqual([product])
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = originalKey
  }
})

test("unrelated photos return no match, provider failures remain errors", async () => {
  const originalFetch = globalThis.fetch
  const image = await normalizeSearchImage(await fixtureImage())
  try {
    globalThis.fetch = async input => String(input).includes("/store/products")
      ? Response.json({ products: [product], count: 1 })
      : Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ description: "Unrelated photo", matches: [] }) }] } }] })
    expect((await searchImage(image, AbortSignal.timeout(10_000))).products).toEqual([])
    globalThis.fetch = async () => Response.json({ error: "upstream failure" }, { status: 503 })
    await expect(searchImage(image, AbortSignal.timeout(10_000))).rejects.toThrow("temporarily unavailable")
  } finally { globalThis.fetch = originalFetch }
})

test("upload endpoint handles missing configuration and invalid files without exposing secrets", async () => {
  const originalKey = process.env.GEMINI_API_KEY
  try {
    delete process.env.GEMINI_API_KEY
    expect((await POST(new Request("http://localhost/api/image-search", { method: "POST" }))).status).toBe(503)
    process.env.GEMINI_API_KEY = "test-only-key"
    const form = new FormData()
    form.set("image", new File(["fake image"], "fake.png", { type: "image/png" }))
    const response = await POST(new Request("http://localhost/api/image-search", { method: "POST", body: form }))
    expect(response.status).toBe(400)
    expect(await response.text()).not.toContain("test-only-key")
  } finally {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = originalKey
  }
})

test("customer uploads photo and receives a real product link", async ({ page }) => {
  await page.route("**/api/image-search", route => route.fulfill({ json: { description: "Similar frames", products: [product] } }))
  await page.goto("/search")
  await page.getByLabel("Choose a product photo").setInputFiles({ name: "frames.png", mimeType: "image/png", buffer: await fixtureImage() })
  await expect(page.getByAltText("Your uploaded product photo")).toBeVisible()
  await page.getByRole("button", { name: "Search by photo" }).click()
  await expect(page.getByRole("heading", { name: "Possible matches" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Photo test frames/ })).toHaveAttribute("href", "/products/photo-test-frames")
})

test("mobile no-match and error states offer the correct WhatsApp chat", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route("**/api/image-search", route => route.fulfill({ json: { description: "No match", products: [] } }))
  await page.goto("/search")
  await page.getByLabel("Choose a product photo").setInputFiles({ name: "frames.png", mimeType: "image/png", buffer: await fixtureImage() })
  await page.getByRole("button", { name: "Search by photo" }).click()
  await expect(page.getByRole("heading", { name: "No confident match found" })).toBeVisible()
  const contact = page.getByRole("link", { name: "Ask us on WhatsApp" })
  await expect(contact).toHaveAttribute("href", /^https:\/\/wa\.me\/84828008881\?text=/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: "test-results/image-search-mobile.png", fullPage: true })
  await page.route("**/api/image-search", route => route.fulfill({ status: 503, json: { error: "Photo search is temporarily unavailable." } }))
  await page.getByRole("button", { name: "Search by photo" }).click()
  await expect(page.getByRole("alert").filter({ hasText: "temporarily unavailable" })).toBeVisible()
  await expect(contact).toBeVisible()
})
