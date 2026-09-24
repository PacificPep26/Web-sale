import Image from "next/image"

export function EyewearHero() {
  return (
    <section className="lux-hero" aria-labelledby="eyewear-heading">
      <div className="lux-hero-media">
        <Image
          src="/brand-hero/hero-eyewear-edit.jpg"
          alt="High fashion luxury eyewear campaign with models in tailored black attire"
          fill
          priority
          sizes="100vw"
          className="lux-hero-image"
        />
        <div className="lux-hero-shade" />
        {/* The image clips this decorative white layer at its exact lower edge. */}
        <div className="lux-hero-copy lux-hero-copy-overlay" aria-hidden="true">
          <div className="lux-hero-copy-layout">
            <div className="lux-hero-heading">
              <p className="lux-hero-title">THE EYEWEAR EDIT</p>
              <span className="lux-light-link">Discover the collection</span>
            </div>
            <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
          </div>
        </div>
      </div>
      <div className="lux-hero-copy">
        <div className="lux-hero-copy-layout">
          <div className="lux-hero-heading">
            <h1 id="eyewear-heading" className="lux-hero-title">THE EYEWEAR EDIT</h1>
            <a href="#designers" className="lux-light-link">Discover the collection</a>
          </div>
          <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
        </div>
      </div>
    </section>
  )
}
