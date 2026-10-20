'use client'

import {
  motion,
  type MotionValue,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { type ReactNode, useRef, useSyncExternalStore } from 'react'

/**
 * Cinematic scroll primitives (Motion). Everything is driven by native scroll
 * position — no scroll hijacking — and collapses to static under reduced motion.
 * Position-locked effects (parallax) read raw progress; reveals use a light
 * spring so they settle rather than track every wheel tick.
 */

const SPRING = { stiffness: 150, damping: 30, mass: 0.4 }

const WIDE = '(min-width: 48rem)'
const subscribeWide = (cb: () => void) => {
  const q = window.matchMedia(WIDE)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false)

/** Featured media opens from a cropped, slightly distant frame to full size as it reaches centre. */
export function Dolly({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 55%'] })
  const p = useSpring(scrollYProgress, SPRING)
  const y = useTransform(p, [0, 1], [12, 0])
  const x = useTransform(p, [0, 1], [7, 0])
  const scale = useTransform(p, [0, 1], [0.94, 1])
  const clipPath = useMotionTemplate`inset(${y}% ${x}% ${y}% ${x}% round 4px)`
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { clipPath, scale }}>
      {children}
    </motion.div>
  )
}

/** Inner layer that drifts against the scroll inside a clipped frame (oversized to hide edges). */
export function ParallaxLayer({ children, amount = 7, className = '' }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`])
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div className="absolute inset-[-9%]" style={reduce ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  )
}

/** Section rule that draws from the left as the heading arrives. */
export function RuleDraw({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 98%', 'start 62%'] })
  const scaleX = useSpring(scrollYProgress, SPRING)
  return (
    <span ref={ref} aria-hidden="true" className={`relative block h-px overflow-hidden bg-line/40 ${className}`}>
      <motion.span className="absolute inset-0 origin-left bg-line-strong" style={reduce ? undefined : { scaleX }} />
    </span>
  )
}

/** Column that moves at a different rate than the page (desktop only), for depth between columns. */
export function Drift({ children, from = 48, to = -48, className }: { children: ReactNode; from?: number; to?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const wide = useWide()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [from, to])
  return (
    <motion.div ref={ref} className={className} style={reduce || !wide ? undefined : { y }}>
      {children}
    </motion.div>
  )
}

/** A window that swings up into place with perspective as it enters. */
export function TiltIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 62%'] })
  const p = useSpring(scrollYProgress, SPRING)
  const rotateX = useTransform(p, [0, 1], [14, 0])
  const scale = useTransform(p, [0, 1], [0.94, 1])
  const opacity = useTransform(p, [0, 0.5, 1], [0.25, 0.85, 1])
  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { rotateX, scale, opacity, transformPerspective: 1400, transformOrigin: '50% 100%' }}
    >
      {children}
    </motion.div>
  )
}

/** Hero exit: the identity row lifts and dims as the hero leaves, in step with the mark's flight. */
export function HeroExit({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  // 0 → 1 over the first 60% of a viewport, the same stretch the mark takes to reach the navbar.
  const t = useTransform(scrollY, (v) => (typeof window === 'undefined' ? 0 : Math.min(1, v / (window.innerHeight * 0.6))))
  const y = useTransform(t, [0, 1], [0, -110])
  const opacity = useTransform(t, [0, 0.7], [1, 0])
  return (
    <motion.div className={className} style={reduce ? undefined : { y, opacity }}>
      {children}
    </motion.div>
  )
}

// ── 01 / giriş: pinned statement ───────────────────────────────

function Word({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: string }) {
  const opacity = useTransform(progress, range, [0.13, 1])
  const y = useTransform(progress, range, ['0.18em', '0em'])
  return (
    <motion.span className="mr-[0.24em] inline-block" style={{ opacity, y }}>
      {children}
    </motion.span>
  )
}

/**
 * The intro statement holds the screen while it is read: words light up one by
 * one with scroll, a red rail tracks progress, then the scene lifts away.
 */
export function IntroScene({ text, label = 'giriş', index = '01' }: { text: string; label?: string; index?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 })
  const rail = useTransform(progress, [0.06, 0.78], [0, 1])
  const lift = useTransform(scrollYProgress, [0.84, 1], [0, -56])
  const fade = useTransform(scrollYProgress, [0.86, 1], [1, 0.35])
  const words = text.split(/\s+/).filter(Boolean)

  const textClass = 'text-[clamp(1.75rem,4.1vw,3.5rem)] font-normal leading-[1.14] tracking-[-0.028em] text-fg'
  const labelEl = (
    <p className="meta">
      <span className="text-accent-text">{index}</span> / {label}
    </p>
  )

  if (reduce) {
    return (
      <section id="giris" aria-label="Giriş" className="shell scroll-mt-24 py-24 md:py-36">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-2">{labelEl}</div>
          <p className={`md:col-span-10 ${textClass}`}>{text}</p>
        </div>
      </section>
    )
  }

  const span = 0.66
  const start = 0.07
  return (
    <section ref={ref} id="giris" aria-label="Giriş" className="relative h-[185vh] md:h-[220vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div className="shell grid w-full gap-8 md:grid-cols-12" style={{ y: lift, opacity: fade }}>
          <div className="flex items-center gap-4 md:col-span-2 md:flex-col md:items-start">
            {labelEl}
            <span aria-hidden="true" className="relative block h-px w-24 bg-line md:hidden">
              <motion.span className="absolute inset-0 origin-left bg-accent" style={{ scaleX: rail }} />
            </span>
            <span aria-hidden="true" className="relative hidden h-44 w-px bg-line md:block">
              <motion.span className="absolute inset-0 origin-top bg-accent" style={{ scaleY: rail }} />
            </span>
          </div>
          <p className={`md:col-span-10 ${textClass}`}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
              {words.map((w, i) => {
                const a = start + (span * i) / words.length
                const b = Math.min(start + span, a + (span / words.length) * 3)
                return (
                  <Word key={i} progress={progress} range={[a, b]}>
                    {w}
                  </Word>
                )
              })}
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
