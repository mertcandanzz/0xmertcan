'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import 'lenis/dist/lenis.css'

/**
 * Framer-style inertial scrolling (Lenis). It smooths the browser's own scroll
 * position, so everything scroll-linked (the signature flight, Motion scenes,
 * sticky sections) keeps working unchanged.
 * - Off under reduced motion; touch devices keep their native scrolling.
 * - Pauses while a dialog locks the page (command palette, mobile menu).
 */
export function SmoothScroll() {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -72 },
      autoRaf: true,
      // Scrollable panels inside dialogs scroll on their own.
      prevent: (node) => Boolean(node.closest('[role="dialog"]')),
    })
    lenisRef.current = lenis

    // Dialogs set body overflow:hidden — stop smoothing while they are open.
    const sync = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start())
    const mo = new MutationObserver(sync)
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => {
      mo.disconnect()
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // New page: start at the top without an animated glide.
  useEffect(() => {
    if (!window.location.hash) lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  return null
}
