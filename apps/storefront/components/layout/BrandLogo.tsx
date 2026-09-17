import Image from "next/image"
export function BrandLogo() {
  return <span className="lux-logo"><Image src="/branding/luxeshade-logo.png" alt="LuxeShade" width={1600} height={533} priority /></span>
}
