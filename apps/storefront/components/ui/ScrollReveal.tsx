"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ComponentType, ElementType, PropsWithChildren, ReactNode } from "react"

export function ScrollReveal({
  children,
  as = "div",
  className,
  delay = 0,
  fromColor = "#8c8c88",
  toColor = "#191919",
}: {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  fromColor?: string
  toColor?: string
}) {
  const reduce = useReducedMotion()
  const MotionTag = (motion[as as "div"] ?? motion.div) as ComponentType<
    PropsWithChildren<Record<string, unknown>>
  >

  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 32, color: fromColor }}
      whileInView={{ opacity: 1, y: 0, color: toColor }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  )
}
