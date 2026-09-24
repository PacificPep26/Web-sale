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

  // Large downward translation (0px -> 190px) to pull title completely down into dedicated white space
  const y = useTransform(scrollYProgress, [0, 0.40], ["0px", "190px"])
  const color = useTransform(scrollYProgress, [0.04, 0.22], ["#fafaf8", "#191919"])

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
        style={reduceMotion ? undefined : { color, y }}
      >
        <div className="lux-hero-copy-layout">
          <motion.div
            className="lux-hero-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 id="eyewear-heading" className="lux-hero-title">THE EYEWEAR EDIT</h1>
            <a href="#designers" className="lux-light-link">Discover the collection</a>
          </motion.div>
          <motion.p
            className="lux-hero-quote"
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            &ldquo;Luxury within sight.&rdquo;
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}
