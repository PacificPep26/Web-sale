import { BrandLogo } from "./BrandLogo"
import Link from "next/link"
export function EyewearFooter() {
  return <footer className="lux-footer"><div className="lux-footer-main"><div><Link href="/" className="lux-wordmark"><BrandLogo /></Link><p>A considered collection of remarkable eyewear.</p></div><nav aria-label="Shop"><h2>EXPLORE</h2><Link href="/collections/eyewear">All eyewear</Link><Link href="/#designers">Our designers</Link><Link href="/search">Find your frames</Link></nav><nav aria-label="Client services"><h2>CLIENT SERVICES</h2><Link href="/pages/shipping">Shipping</Link><Link href="/pages/returns">Returns</Link><Link href="/pages/about">About us</Link><a href="mailto:luxeshadee@gmail.com">luxeshadee@gmail.com</a></nav></div><div className="lux-footer-bottom"><span>© {new Date().getFullYear()} LuxeShade</span><div><Link href="/pages/privacy">Privacy</Link><Link href="/pages/terms">Terms & conditions</Link></div><span>UNITED STATES / USD</span></div></footer>
}
