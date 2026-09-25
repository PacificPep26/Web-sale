const DEFAULT_LUXESHADE_STOREFRONT_URL = "https://luxshade.up.railway.app"

/**
 * Product images historically imported from the LuxeShade storefront use a
 * path such as `/images/eyewear/frame.jpg`. The Admin is served by a different
 * origin, so a browser would otherwise request that path from the Medusa API.
 */
export const resolveAdminProductThumbnail = (
  thumbnail: string | null | undefined,
  storefrontUrl = process.env.LUXESHADE_STOREFRONT_URL || DEFAULT_LUXESHADE_STOREFRONT_URL
) => {
  if (!thumbnail) return undefined

  if (/^https?:\/\//i.test(thumbnail) || thumbnail.startsWith("data:")) {
    return thumbnail
  }

  if (!thumbnail.startsWith("/")) return thumbnail

  try {
    return new URL(thumbnail, storefrontUrl).toString()
  } catch {
    return thumbnail
  }
}
