import Image from "next/image"
import Link from "next/link"
import type { ThemeConfig } from "@/themes/registry"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { EyewearHero } from "@/components/eyewear-hero"

export function EyewearHome({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="lux-home">
      <EyewearHero />
      <section id="designers" className="lux-designers" aria-label="Designer eyewear collections">
        <div className="lux-brand-grid">
          {theme.brands?.map((brand) => (
            <Link key={brand.label} href={brand.href} className="lux-brand-card">
              <div className="lux-brand-photo"><Image src={brand.image} alt={`${brand.label} eyewear collection`} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 50vw, 25vw" /></div>
              <div className="lux-brand-label"><h3>{brand.label}</h3><span aria-hidden="true">↗</span></div>
              <p>Discover the collection</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="lux-editorial">
        <div className="lux-editorial-image"><Image src="/brand-hero/miu-miu-v2.png" alt="Tortoiseshell cat-eye sunglasses in warm sunlight" fill sizes="(max-width: 640px) 100vw, 60vw" /></div>
        <div className="lux-editorial-copy"><p className="lux-kicker">IN A NEW LIGHT</p><ScrollReveal as="h2">The art of<br />being yourself.</ScrollReveal><p>Distinctive shapes. Considered details. Find the frames that feel entirely your own.</p><Link href="/collections/eyewear?brand=miu-miu" className="lux-text-link">Explore Miu Miu</Link></div>
      </section>
      <div className="lux-closing"><ScrollReveal as="p">Luxury brands. Exceptional prices.</ScrollReveal><Link href="/collections/eyewear" className="lux-dark-button">Find your next pair</Link></div>
    </div>
  )
}
