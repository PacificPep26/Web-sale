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

  const copyY = useTransform(scrollYProgress, [0, 0.35], ["calc(-100% - 56px)", "0px"])
  const overlayY = useTransform(scrollYProgress, [0, 0.35], ["0px", "calc(100% + 56px)"])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.18, 0.35], [0, 0, 1])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.18, 0.35], [1, 1, 0])
  const copyStyle = reduceMotion ? { y: 0, opacity: 1 } : { y: copyY, opacity: copyOpacity }
  const overlayStyle = reduceMotion ? { y: 0, opacity: 1 } : { y: overlayY, opacity: overlayOpacity }

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
        {/* The image clips this decorative white layer at its exact lower edge. */}
        <motion.div className="lux-hero-copy lux-hero-copy-overlay" style={overlayStyle} aria-hidden="true">
          <div className="lux-hero-copy-layout">
            <div className="lux-hero-heading">
              <p className="lux-hero-title">THE EYEWEAR EDIT</p>
              <span className="lux-light-link">Discover the collection</span>
            </div>
            <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
          </div>
        </motion.div>
      </div>
      <motion.div
        className="lux-hero-copy"
        style={copyStyle}
      >
        <div className="lux-hero-copy-layout">
          <div className="lux-hero-heading">
            <h1 id="eyewear-heading" className="lux-hero-title">THE EYEWEAR EDIT</h1>
            <a href="#designers" className="lux-light-link">Discover the collection</a>
          </div>
          <p className="lux-hero-quote">&ldquo;Luxury within sight.&rdquo;</p>
        </div>
      </motion.div>
    </section>
  )
}
