"use client"

import Image from "next/image"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

export function EyewearHero() {
  const heroRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 0.45], ["calc(-100% - 64px)", "0%"])
  const color = useTransform(scrollYProgress, [0.12, 0.36], ["#fafaf8", "#191919"])

  return (
    <section ref={heroRef} className="lux-hero" aria-labelledby="eyewear-heading">
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
      </div>
      <motion.div
        className="lux-hero-copy"
        style={reduceMotion ? undefined : { y, color }}
      >
        <div className="lux-hero-heading">
          <h1 id="eyewear-heading">THE EYEWEAR EDIT</h1>
          <a href="#designers" className="lux-light-link">Discover the collection</a>
        </div>
        <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
      </motion.div>
    </section>
  )
}
