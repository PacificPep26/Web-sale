const phone = "84828008881"

export function whatsappSearchUrl(query?: string) {
  const message = query
    ? `Hi LuxeShade, I'm looking for this product: ${query}. Can you help me find it?`
    : "Hi LuxeShade, I'd like help finding a product from a photo. I'll attach the photo here."
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
