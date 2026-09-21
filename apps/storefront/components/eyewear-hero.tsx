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
      </div>
      <div className="lux-hero-copy">
        <div className="lux-hero-heading">
          <h1 id="eyewear-heading">THE EYEWEAR EDIT</h1>
          <a href="#designers" className="lux-light-link">Discover the collection</a>
        </div>
        <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
      </div>
    </section>
  )
}
