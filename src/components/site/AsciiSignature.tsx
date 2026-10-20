'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { layout, STROKE, VIEW_H, VIEW_Y } from '@/brand/glyphs'
import LetterGlitch from '@/components/reactbits/LetterGlitch'

/**
 * The hero signature drawn in ASCII: React Bits LetterGlitch fills the mark and
 * is clipped to the wordmark's vector silhouette, so the letterforms stay clean
 * while every character inside keeps changing (bold white, glitching red).
 * A soft glow makes the characters read as light rather than texture.
 * Desktop only — on small screens the solid vector mark is more legible.
 */

// Dense glyphs only, so each cell reads as ink and the letterforms stay solid.
const CHARS = '#@%&$80BWMNQXKRHDEAGOS<>/\\{}[]2345679'
const SPACING = 0.04
const WEIGHT = 700
const GLITCH_COLORS = ['#E53935', '#E53935', '#ff6a61', '#F1EFEA']
const SLASH = 1
const BRACKETS = new Set([0, 11])

const { glyphs, width: VBW } = layout()
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Character size in CSS px for a mark of the given width: ~3 characters across a stroke. */
const fontSizeFor = (markWidth: number) => clamp(Math.round((markWidth / VBW) * 0.66 * 2) / 2, 7, 13)

/** SVG mask of the selected glyph strokes, in the wordmark's own viewBox. */
function glyphMask(include: (index: number) => boolean) {
  const paths = glyphs
    .filter((g) => include(g.index))
    .map((g) => `<path d="${g.d}" transform="translate(${g.x} 0)"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${VIEW_Y} ${VBW} ${VIEW_H}" preserveAspectRatio="none"><g fill="none" stroke="#fff" stroke-width="${STROKE}" stroke-linecap="square" stroke-linejoin="miter">${paths}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function maskStyle(url: string): React.CSSProperties {
  return { maskImage: url, WebkitMaskImage: url, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }
}

type Props = {
  /** Glyphs revealed so far by the typed intro. */
  visible: number
  /** False once the mark has settled into the navbar: characters stop changing. */
  live: boolean
  onReady: () => void
}

export function AsciiSignature({ visible, live, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [type, setType] = useState<{ family: string; size: number; unit: number } | null>(null)
  const readyRef = useRef(onReady)
  useEffect(() => {
    readyRef.current = onReady
  })

  // Size the characters to the mark, wait for the mono font, then reveal.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let alive = true
    let frame = 0
    let announced = false
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-mono').trim() || 'ui-monospace, monospace'
    const build = async () => {
      const width = el.clientWidth
      const size = fontSizeFor(width)
      try {
        await document.fonts?.load(`${WEIGHT} ${size}px ${family}`, CHARS)
      } catch {}
      if (!alive) return
      setType({ family, size, unit: width / VBW })
      if (!announced) {
        announced = true
        // Two frames: LetterGlitch has drawn its first frame by then.
        frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => alive && readyRef.current())))
      }
    }
    let timer: ReturnType<typeof setTimeout>
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(build, 80)
    })
    ro.observe(el)
    build()
    return () => {
      alive = false
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [])

  const masks = useMemo(
    () => ({
      ink: glyphMask((i) => i < visible),
      slash: glyphMask((i) => i === SLASH && i < visible),
      brackets: glyphMask((i) => BRACKETS.has(i) && i < visible),
    }),
    [visible],
  )

  // Glow radii follow the mark's scale (glyph units → px), so they shrink with it.
  const glow = type
    ? `drop-shadow(0 0 ${(type.unit * 0.22).toFixed(1)}px rgba(241, 239, 234, 0.38)) drop-shadow(0 0 ${(type.unit * 0.9).toFixed(1)}px rgba(229, 57, 53, 0.16))`
    : undefined

  return (
    <div ref={ref} aria-hidden="true" className="ascii-sig pointer-events-none absolute inset-0 isolate">
      {type && (
        <>
          {/* Exact-silhouette backing (no outline: the field is carved to the same colour around it).
              It also gives the multiply tints below an opaque base, so only characters get coloured. */}
          <div className="absolute inset-0 bg-bg" style={maskStyle(masks.ink)} />
          {/* Faint solid letterform: the silhouette reads at a glance, characters live on top. */}
          <div className="absolute inset-0 bg-fg/[0.13]" style={maskStyle(masks.ink)} />
          <div className="absolute inset-0" style={{ filter: glow }}>
            <div className="absolute inset-0" style={maskStyle(masks.ink)}>
              <LetterGlitch
              fontFamily={type.family}
              fontWeight={WEIGHT}
              fontSize={type.size}
              spacing={SPACING}
              characters={CHARS}
              baseColor="#F1EFEA"
              baseOpacity={1}
              glitchColors={GLITCH_COLORS}
              glitchAmount={0.8}
              speed={live ? 3 : 0}
              density={1}
              flow={0.1}
              smooth
              interactive
              cursorRadius={90}
              clickEffect="tear"
              intro
              />
            </div>
          </div>
          <div className="absolute inset-0 mix-blend-multiply" style={{ ...maskStyle(masks.slash), backgroundColor: '#E53935' }} />
          <div className="absolute inset-0 mix-blend-multiply" style={{ ...maskStyle(masks.brackets), backgroundColor: '#8f8f95' }} />
        </>
      )}
    </div>
  )
}
