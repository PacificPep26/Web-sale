export type ImageSearchProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

export type ImageSearchResult = {
  description: string
  products: ImageSearchProduct[]
}
