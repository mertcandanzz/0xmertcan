'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

import { WORDMARK_RATIO, Wordmark } from '@/brand/Wordmark'
import { SIGNATURE } from '@/brand/glyphs'
import { NAV } from '@/lib/site'

import { AsciiSignature } from './AsciiSignature'
import { MobileMenu } from './MobileMenu'
import { openCommandPalette } from './CommandPalette'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
const GLYPH_COUNT = Array.from(SIGNATURE).length
const INTRO_KEY = 'oxm:intro-seen'

// ASCII signature only where it is legible: wide viewports (md and up).
const WIDE = '(min-width: 48rem)'
const subscribeWide = (cb: () => void) => {
  const q = window.matchMedia(WIDE)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
// Smooth start and a zero-velocity landing in the navbar slot.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}

type Geometry = {
  baseW: number
  start: { x: number; y: number } // hero anchor (document coords)
  end: { x: number; y: number; w: number } // navbar slot (viewport coords)
  range: number
  hasAnchor: boolean
}

/**
 * The site header owns the one and only brand mark. On the home page the mark
 * starts as the giant `</0XMERTCAN>|` in the hero and is continuously mapped
 * to the navbar slot by scroll position; everywhere else it rests in the slot.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const markRef = useRef<HTMLAnchorElement>(null)
  const slotRef = useRef<HTMLSpanElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const geo = useRef<Geometry | null>(null)
  const raf = useRef(0)
  const [visible, setVisible] = useState(GLYPH_COUNT)
  const [typing, setTyping] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [onHero, setOnHero] = useState(isHome)
  // ASCII signature: `asciiMix` eases in once LetterGlitch has drawn; `asciiLive`
  // keeps its characters changing only while the mark is large enough to read them.
  const asciiMix = useRef(0)
  const [asciiLive, setAsciiLive] = useState(true)
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false)
  const ascii = isHome && !reduced && wide

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(q.matches)
    update()
    q.addEventListener('change', update)
    return () => q.removeEventListener('change', update)
  }, [])

  const measure = useCallback(() => {
    const slot = slotRef.current
    if (!slot) return
    const s = slot.getBoundingClientRect()
    const anchor = isHome && !reduced ? document.querySelector<HTMLElement>('[data-sig-anchor]') : null
    const root = document.documentElement
    if (anchor) {
      const a = anchor.getBoundingClientRect()
      const startY = a.top + window.scrollY
      geo.current = {
        baseW: a.width,
        start: { x: a.left, y: startY },
        end: { x: s.left, y: s.top, w: s.width },
        range: Math.max(startY - s.top, window.innerHeight * 0.32),
        hasAnchor: true,
      }
    } else {
      const baseW = Math.min(root.clientWidth, 1408)
      geo.current = { baseW, start: { x: s.left, y: s.top }, end: { x: s.left, y: s.top, w: s.width }, range: 1, hasAnchor: false }
    }
  }, [isHome, reduced])

  const apply = useCallback(() => {
    raf.current = 0
    const g = geo.current
    const el = markRef.current
    if (!g || !el) return
    const scrollY = window.scrollY
    const p = g.hasAnchor ? clamp01(scrollY / g.range) : 1
    const e = ease(p)
    const endScale = g.end.w / g.baseW
    // Interpolate scale in log space so shrinking feels uniform.
    const scale = Math.exp(lerp(0, Math.log(endScale), e))
    const x = lerp(g.start.x, g.end.x, e)
    const y = lerp(g.start.y - scrollY, g.end.y, e)
    el.style.width = `${g.baseW}px`
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`
    document.documentElement.style.setProperty('--p', p.toFixed(4))
    // Live box of the mark (viewport px) for the hero field, which carves around it.
    window.dispatchEvent(new CustomEvent('oxm:mark', { detail: { x, y, w: g.baseW * scale, p } }))
    el.dataset.state = p >= 1 ? 'nav' : p <= 0 ? 'hero' : 'moving'
    // ASCII ↔ solid: the characters settle into the vector mark as it shrinks.
    const ascii = (g.hasAnchor ? asciiMix.current : 0) * (1 - smooth(0.18, 0.58, p))
    el.style.setProperty('--ascii', ascii.toFixed(3))
    el.style.setProperty('--ink', (1 - ascii).toFixed(3))
    if (g.hasAnchor) {
      const live = p < 0.7
      setAsciiLive((prev) => (prev === live ? prev : live))
      const heroState = p < 0.98
      setOnHero((prev) => (prev === heroState ? prev : heroState))
    }
  }, [])

  const schedule = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(apply)
  }, [apply])

  // The solid mark dissolves into ASCII once LetterGlitch is on screen.
  const onAsciiReady = useCallback(() => {
    const t0 = performance.now()
    const step = (now: number) => {
      asciiMix.current = Math.min(1, (now - t0) / 650)
      apply()
      if (asciiMix.current < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [apply])

  // Route changes: re-measure and glide the mark to its new resting place.
  useIsoLayoutEffect(() => {
    const el = markRef.current
    const first = !el?.style.transform
    if (!ascii) asciiMix.current = 0
    measure()
    if (el && !first && !reduced) {
      el.dataset.animating = 'true'
      const done = () => {
        el.dataset.animating = 'false'
      }
      el.addEventListener('transitionend', done, { once: true })
      setTimeout(done, 800)
    }
    apply()
  }, [pathname, ascii, measure, apply, reduced])

  useEffect(() => {
    const onScroll = () => schedule()
    const onResize = () => {
      measure()
      schedule()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('oxm:mark-request', onScroll)
    const ro = new ResizeObserver(onResize)
    const hero = document.querySelector('[data-hero]')
    if (hero) ro.observe(hero)
    if (headerRef.current) ro.observe(headerRef.current)
    // Hero text above the anchor depends on web fonts; re-measure once they land.
    document.fonts?.ready.then(onResize).catch(() => {})
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('oxm:mark-request', onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [measure, schedule, pathname])

  // Reduced motion: no morph. The hero shows a static mark; the navbar mark
  // fades in only once the hero signature has scrolled out of view.
  useEffect(() => {
    // Off the home page showMark ignores onHero, so there is nothing to sync.
    if (!reduced || !isHome) return
    const anchor = document.querySelector('[data-sig-anchor]')
    if (!anchor) return
    const io = new IntersectionObserver(([entry]) => setOnHero(entry.isIntersecting), { rootMargin: '-64px 0px 0px 0px' })
    io.observe(anchor)
    return () => io.disconnect()
  }, [reduced, isHome, pathname])

  // Move focus to the new page's content after client navigation (not on first load).
  const firstPath = useRef(true)
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false
      return
    }
    document.getElementById('icerik')?.focus({ preventScroll: true })
  }, [pathname])

  // Typed intro: once per 12h, never under reduced motion, cancels on scroll.
  useEffect(() => {
    const root = document.documentElement
    if (!root.hasAttribute('data-intro')) return
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    let frame = 0
    const detach = () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', finish)
      window.removeEventListener('keydown', finish)
    }
    const finish = () => {
      detach()
      setVisible(GLYPH_COUNT)
      setTyping(false)
      root.removeAttribute('data-intro')
    }
    try {
      localStorage.setItem(INTRO_KEY, String(Date.now()))
    } catch {}
    // Syncing with the pre-paint DOM flag set by the inline intro script.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(0)
    setTyping(true)
    // Let React paint the empty state before releasing the CSS guard.
    frame = requestAnimationFrame(() => root.removeAttribute('data-intro'))
    const step = () => {
      i += 1
      setVisible(i)
      if (i >= GLYPH_COUNT) {
        timer = setTimeout(finish, 120)
        return
      }
      // Slightly human rhythm: brackets fast, letters even.
      timer = setTimeout(step, i === 2 ? 110 : 52 + ((i * 37) % 23))
    }
    timer = setTimeout(step, 520)
    window.addEventListener('scroll', finish, { passive: true })
    window.addEventListener('keydown', finish)
    // Cleanup only detaches; a remount (StrictMode) restarts the intro cleanly.
    return () => {
      detach()
      if (!root.hasAttribute('data-intro')) {
        setVisible(GLYPH_COUNT)
        setTyping(false)
      }
    }
  }, [])

  const showMark = !(reduced && isHome && onHero)

  return (
    <header ref={headerRef} className="site-header fixed inset-x-0 top-0 z-50" style={isHome ? undefined : ({ '--p': 1 } as React.CSSProperties)}>
      <div className="site-header__bg pointer-events-none absolute inset-0 backdrop-blur-md backdrop-saturate-150" aria-hidden="true" />
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        İçeriğe geç
      </a>
      <div className="shell relative flex h-[var(--header-h)] items-center justify-between gap-6">
        <span ref={slotRef} aria-hidden="true" className="block w-[7.75rem] shrink-0 md:w-[9.5rem]" style={{ aspectRatio: WORDMARK_RATIO }} />
        <nav aria-label="Ana menü" className="site-header__nav hidden items-center gap-7 md:flex">
          <ul className="flex items-center gap-7 text-[0.9rem] text-fg-soft">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? 'page' : undefined} className="link-draw pb-1 transition-colors hover:text-fg aria-[current=page]:text-fg">
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={openCommandPalette}
            className="flex h-8 items-center gap-2.5 rounded-full border border-line-strong px-3 text-[0.8rem] text-muted transition-colors hover:border-muted hover:text-fg"
            aria-label="Komut paletini aç"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <span>Ara</span>
            <kbd className="font-mono text-[0.68rem] text-faint">⌘K</kbd>
          </button>
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={openCommandPalette}
            className="grid size-10 place-items-center rounded-full text-fg-soft hover:text-fg"
            aria-label="Ara"
          >
            <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4.5 4.5" strokeLinecap="square" />
            </svg>
          </button>
          <MobileMenu pathname={pathname} />
        </div>
      </div>

      <Link
        ref={markRef}
        href="/"
        aria-label="0xmertcan — ana sayfa"
        data-sig
        className="sig-mark absolute left-0 top-0 block transition-opacity duration-300"
        style={{ opacity: showMark ? 1 : 0, pointerEvents: showMark ? undefined : 'none' }}
        tabIndex={showMark ? undefined : -1}
      >
        {ascii && <AsciiSignature visible={visible} live={asciiLive} onReady={onAsciiReady} />}
        <Wordmark visible={visible} caretClassName="caret" className="relative block h-auto w-full" title="</0XMERTCAN>" />
        <span className="sr-only">0xmertcan</span>
        <CaretState typing={typing} />
      </Link>
    </header>
  )
}

/** Mirrors typing state onto the caret rect without re-rendering the SVG tree. */
function CaretState({ typing }: { typing: boolean }) {
  useEffect(() => {
    document.querySelectorAll<SVGRectElement>('[data-sig] .caret').forEach((el) => el.setAttribute('data-typing', String(typing)))
  }, [typing])
  return null
}
