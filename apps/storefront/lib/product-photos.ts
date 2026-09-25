import type { HttpTypes } from "@medusajs/types"
import photos from "./product-photos.json"
import aliases from "./product-photo-aliases.json"

export const productPhotos: Record<string, { src: string; scale: number; x: number; y: number }> = photos

export function productPhoto(handle?: string | null) {
  const canonical = handle && Object.hasOwn(aliases, handle) ? aliases[handle as keyof typeof aliases] : handle
  return canonical && Object.hasOwn(productPhotos, canonical) ? productPhotos[canonical].src : undefined
}

function photoHandle(url?: string | null) {
  return url?.match(/\/images\/(?:sunglasses|eyewear)\/(sun-[^/?]+)\.(?:jpg|png)(?:[?#]|$)/)?.[1]
}

export function resolveProductPhoto(url?: string | null) {
  return productPhoto(photoHandle(url)) ?? url
}

export function productPhotoStyle(url?: string | null) {
  const handle = photoHandle(url)
  const photo = handle && Object.hasOwn(productPhotos, handle) ? productPhotos[handle] : undefined
  if (!photo) return undefined
  return { padding: 0, transform: `translate(${photo.x}%, ${photo.y}%) scale(${photo.scale})` }
}

export function withProductPhoto(product: HttpTypes.StoreProduct): HttpTypes.StoreProduct {
  const url = productPhoto(product.handle)
  if (!url) return product
  return {
    ...product,
    thumbnail: url,
    // Local curated photography replaces the legacy supplier gallery entirely.
    // Keeping the API images here lets old portraits become selectable again.
    images: [{ id: `${product.id}-normalized`, url, rank: 0 }],
  }
}
