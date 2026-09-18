import { ImageSearchError, normalizeSearchImage, readLimitedBody, searchImage } from "@/lib/image-search"
import { createImageSearchLimiter } from "@/lib/image-search-limits"

export const runtime = "nodejs"
export const maxDuration = 90

// Per-process limits suit the current single-instance Railway service.
const limiter = createImageSearchLimiter()
const headers = { "Cache-Control": "no-store" }

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Photo search is not available yet. Send us your photo on WhatsApp and we'll help you find it." }, { status: 503, headers })
  }
  const origin = request.headers.get("origin")
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host
  if (origin) {
    try {
      if (new URL(origin).host !== host) throw new Error("origin")
    } catch { return Response.json({ error: "Request not allowed." }, { status: 403, headers }) }
  }
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown"
  const permit = limiter.acquire(ip)
  if (!permit.allowed) {
    return Response.json({ error: permit.error }, { status: 429, headers: { ...headers, "Retry-After": String(permit.retryAfter) } })
  }
  try {
    const type = request.headers.get("content-type") || ""
    if (!type.startsWith("multipart/form-data;")) throw new ImageSearchError("Please upload a product photo.", 400)
    const bytes = await readLimitedBody(request.body, 5 * 1024 * 1024 + 64 * 1024)
    let form: FormData
    try { form = await new Response(bytes, { headers: { "Content-Type": type } }).formData() }
    catch { throw new ImageSearchError("Please upload a valid image file.", 400) }
    const file = form.get("image")
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new ImageSearchError("Please choose a JPG, PNG or WebP image.", 400)
    if (!file.size || file.size > 5 * 1024 * 1024) throw new ImageSearchError("Please choose an image smaller than 5 MB.", 413)
    const image = await normalizeSearchImage(Buffer.from(await file.arrayBuffer()))
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(75_000)])
    return Response.json(await searchImage(image, signal), { headers })
  } catch (error) {
    const known = error instanceof ImageSearchError
    return Response.json({ error: known ? error.message : "Photo search is temporarily unavailable. Please try again or send us your photo on WhatsApp." }, { status: known ? error.status : 503, headers })
  } finally { permit.release() }
}
