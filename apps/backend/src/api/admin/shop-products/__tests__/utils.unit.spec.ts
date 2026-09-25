import { resolveAdminProductThumbnail } from "../utils"

describe("resolveAdminProductThumbnail", () => {
  const storefront = "https://shop.example.com"

  it("maps storefront-relative media to the LuxeShade origin", () => {
    expect(resolveAdminProductThumbnail("/images/eyewear/frame.jpg", storefront)).toBe(
      "https://shop.example.com/images/eyewear/frame.jpg"
    )
  })

  it("preserves remote media URLs", () => {
    expect(resolveAdminProductThumbnail("https://images.example.com/frame.jpg", storefront)).toBe(
      "https://images.example.com/frame.jpg"
    )
  })

  it("returns undefined when the product has no image", () => {
    expect(resolveAdminProductThumbnail(undefined, storefront)).toBeUndefined()
  })
})
