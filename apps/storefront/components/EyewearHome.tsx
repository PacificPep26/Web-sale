import Image from "next/image"
import Link from "next/link"
import type { ThemeConfig } from "@/themes/registry"

export function EyewearHome({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="lux-home">
      <section className="lux-hero" aria-label="The eyewear edit">
        <Image
          src="/brand-hero/luxury-campaign-hero.jpg"
          alt="High fashion luxury eyewear campaign with models in tailored black attire"
          fill
          priority
          sizes="100vw"
          className="lux-hero-image"
        />
        <div className="lux-hero-shade" />
        <div className="lux-hero-copy">
          <p>THE LUXURY EDIT · 2026</p>
          <h1>A different<br />point of view.</h1>
          <Link href="/collections/eyewear" className="lux-light-link">Discover the collection</Link>
        </div>
        <span className="lux-hero-caption">HANDCRAFTED MAISONS · PRECISION OPTICS</span>
      </section>
      <section id="designers" className="lux-designers" aria-labelledby="designer-heading">
        <div className="lux-section-heading">
          <div><p className="lux-kicker">THE DESIGNER COLLECTION</p><h2 id="designer-heading">Eight houses. Endless perspective.</h2></div>
          <Link href="/collections/eyewear" className="lux-text-link">Explore all eyewear</Link>
        </div>
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
        <div className="lux-editorial-copy"><p className="lux-kicker">IN A NEW LIGHT</p><h2>The art of<br />being yourself.</h2><p>Distinctive shapes. Considered details. Find the frames that feel entirely your own.</p><Link href="/collections/eyewear?brand=miu-miu" className="lux-text-link">Explore Miu Miu</Link></div>
      </section>
      <div className="lux-closing"><p>Luxury brands. Exceptional prices.</p><Link href="/collections/eyewear" className="lux-dark-button">Find your next pair</Link></div>
    </div>
  )
}
