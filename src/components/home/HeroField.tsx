'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import { CARET, layout, STROKE, VIEW_Y } from '@/brand/glyphs'

// WebGPU renderer, loaded only in the browser and only when WebGPU exists.
const ShapeWaves = dynamic(() => import('@/components/reactbits/ShapeWaves'), { ssr: false })
const LightRays = dynamic(() => import('@/components/reactbits/LightRays'), { ssr: false })
const Topography = dynamic(() => import('@/components/reactbits/Topography'), { ssr: false })

export type HeroBackground = 'topography' | 'rays' | 'shapes'

const FIELD = {
  color: '#66666c',
  hoverColor: '#E53935',
  backgroundColor: '#111113',
  cellSize: 10,
  dotSize: 0.75,
  brightness: 0.4,
  contrast: 1,
  scale: 1,
  fade: 0.25,
} as const

const { glyphs, caretX, width: VBW } = layout()

type Carve = { left: number; top: number; width: number; fieldW: number; key: string }
type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void

/**
 * Paints the wordmark (plus a margin of about one field cell) into a mask, so
 * the field leaves a clean gap where the signature sits — no outline, just the
 * field's own grid stepping around the letters, like the `</>` in the studio.
 */
function carvePainter(c: Carve): Painter {
  return (ctx, width) => {
    const k = width / c.fieldW // mask px per CSS px
    const unit = c.width / VBW // CSS px per glyph unit
    const pad = 12 / unit // ≈ 6px clear margin on each side of every stroke
    ctx.save()
    ctx.translate(c.left * k, c.top * k)
    ctx.scale(unit * k, unit * k)
    ctx.translate(0, -VIEW_Y)
    ctx.lineWidth = STROKE + pad
    ctx.lineCap = 'square'
    // Round joins: thick miters on M/N/A would spike far past the letters.
    ctx.lineJoin = 'round'
    for (const g of glyphs) {
      ctx.save()
      ctx.translate(g.x, 0)
      ctx.stroke(new Path2D(g.d))
      ctx.restore()
    }
    ctx.fillRect(caretX - pad / 2, CARET.y - pad / 2, CARET.w + pad, CARET.h + pad)
    ctx.restore()
  }
}

const noopSubscribe = () => () => {}
const reducedQuery = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (cb: () => void) => {
  const q = window.matchMedia(reducedQuery)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}

/**
 * Hero backdrop, chosen in the admin (Site ayarları → Hero arka planı):
 *  - topography: React Bits Topography — dim red contour terrain (default)
 *  - rays:       React Bits LightRays — a soft spotlight from above
 *  - shapes:     React Bits ShapeWaves (WebGPU), carved around the mark
 * Shapes details:
 * - Fades out with the header's scroll progress (--p) and pauses once invisible.
 * - Pointer ripples tint the field red; disabled under reduced motion.
 * - No WebGPU, or a GPU error: a static Canvas2D frame of the same field.
 */
export function HeroField({ variant = 'topography' }: { variant?: HeroBackground }) {
  const hasGpu = useSyncExternalStore(noopSubscribe, () => 'gpu' in navigator, () => null)
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => false)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)
  const [carve, setCarve] = useState<Carve | null>(null)

  // Carve around the mark's live box, broadcast by the header on every frame it
  // moves — so the gap travels with the mark and never leaves an imprint behind.
  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    let box = { left: 0, docTop: 0, width: 1 }
    let mark: { x: number; y: number; w: number; p: number } | null = null
    const measureField = () => {
      const r = field.getBoundingClientRect()
      box = { left: r.left, docTop: r.top + window.scrollY, width: r.width }
    }
    const update = () => {
      if (!mark || mark.p > 0.85) return // field has faded out: stop repainting the mask
      const left = mark.x - box.left
      const top = mark.y - (box.docTop - window.scrollY)
      const key = [left, top, mark.w, box.width].map((n) => n.toFixed(1)).join('|')
      setCarve((prev) => (prev?.key === key ? prev : { left, top, width: mark!.w, fieldW: box.width, key }))
    }
    const onMark = (e: Event) => {
      mark = (e as CustomEvent<{ x: number; y: number; w: number; p: number }>).detail
      update()
    }
    const ro = new ResizeObserver(() => {
      measureField()
      update()
    })
    ro.observe(field)
    measureField()
    window.addEventListener('oxm:mark', onMark)
    window.dispatchEvent(new Event('oxm:mark-request'))
    return () => {
      ro.disconnect()
      window.removeEventListener('oxm:mark', onMark)
    }
  }, [])

  const painter = useMemo(() => (carve ? carvePainter(carve) : undefined), [carve])

  // Stop GPU work once the field has faded out; resume when scrolling back up.
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const p = parseFloat(document.documentElement.style.getPropertyValue('--p') || '0')
      const next = p > 0.8
      setPaused((prev) => (prev === next ? prev : next))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const useWebGpu = hasGpu === true && !failed

  return (
    <div ref={fieldRef} aria-hidden="true" className="hero-field pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ backgroundColor: FIELD.backgroundColor }}>
      {variant === 'rays' ? (
        <LightRays raysOrigin="top-center" raysColor="#f3ece6" raysSpeed={0.6} lightSpread={0.55} rayLength={2.4} rayDensity={0.8} raySharpness={0.3} glow={0.5} haze={0.35} intensity={0.85} noiseAmount={0} followMouse mouseInfluence={0.06} cursorShadow={false} clickPulse={false} />
      ) : variant === 'topography' ? (
        <Topography color="#c43431" lineCount={24} lineWidth={1.1} majorLines elevation={1} tilt={30} speed={0.18} glow={0.45} depthOfField={0.35} fog={0.55} brightness={0.64} markers="plus" clickEffect="none" />
      ) : useWebGpu ? (
        <ShapeWaves
          {...FIELD}
          shapes="mixed"
          speed={1}
          flow={0}
          glow={0}
          interactive={!reduced}
          splashRadius={36}
          splashStrength={0.32}
          intro
          introDuration={1.6}
          paused={paused}
          maskPainter={painter}
          maskKey={carve?.key ?? 0}
          onError={() => setFailed(true)}
        />
      ) : hasGpu !== null ? (
        <StaticField painter={painter} paintKey={carve?.key ?? ''} />
      ) : null}
      {/* Soft depth behind the signature: the field dims toward the mark, no hard edge. */}
      {carve && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(${(carve.width * 0.72).toFixed(0)}px ${((carve.width / 8) * 2.6).toFixed(0)}px at ${(carve.left + carve.width / 2).toFixed(0)}px ${(carve.top + carve.width / 16).toFixed(0)}px, rgba(17, 17, 19, 0.62), rgba(17, 17, 19, 0.3) 55%, transparent 100%)`,
          }}
        />
      )}
      {/* Calm the field under the header and behind the name row; blend into the page. */}
      <div className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-bg to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-bg via-bg/85 to-transparent" />
    </div>
  )
}

// ── Static fallback ─────────────────────────────────────────────
// Same construction as the shader: a cell grid, 2-octave gradient noise per
// cell centre, three tone bands mapped to triangle / circle / square, and a
// superellipse edge fade. Drawn once per size change.

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createNoise3(seed = 7) {
  const rand = mulberry32(seed)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + t * (b - a)
  const grad = (h: number, x: number, y: number, z: number) => {
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return (h & 1 ? -u : u) + (h & 2 ? -v : v)
  }
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const Z = Math.floor(z) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)
    const u = fade(x)
    const v = fade(y)
    const w = fade(z)
    const A = perm[X] + Y
    const AA = perm[A] + Z
    const AB = perm[A + 1] + Z
    const B = perm[X + 1] + Y
    const BA = perm[B] + Z
    const BB = perm[B + 1] + Z
    return lerp(
      lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u), lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
      lerp(
        lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u),
        lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u),
        v,
      ),
      w,
    )
  }
}

function drawField(canvas: HTMLCanvasElement, painter?: Painter) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = FIELD.backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = FIELD.color

  // Optional carve: paint the mask at canvas resolution and skip cells whose centre is inside it.
  let carved: Uint8ClampedArray | null = null
  if (painter) {
    const mask = document.createElement('canvas')
    mask.width = width
    mask.height = height
    const mctx = mask.getContext('2d', { willReadFrequently: true })
    if (mctx) {
      mctx.fillStyle = '#fff'
      mctx.strokeStyle = '#fff'
      painter(mctx, width, height)
      carved = mctx.getImageData(0, 0, width, height).data
    }
  }

  const noise = createNoise3()
  const cols = Math.max(1, Math.round(width / (FIELD.cellSize * dpr)))
  const cell = width / cols
  const rows = Math.max(1, Math.floor(height / cell))
  const oy = (height - rows * cell) / 2
  const feature = 32 * cell * FIELD.scale
  const threshold = 0.5 - (FIELD.brightness - 0.5) * 0.4
  const gain = 2.8 * FIELD.contrast
  const half = (FIELD.dotSize * cell) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) * cell
      const cy = oy + (r + 0.5) * cell
      // Edge fade, as in the shader (superellipse radius, exponent 2.5).
      const qx = Math.abs((cx / width) * 2 - 1)
      const qy = Math.abs((cy / height) * 2 - 1)
      const radius = Math.pow(Math.pow(qx, 2.5) + Math.pow(qy, 2.5), 1 / 2.5) / Math.pow(2, 1 / 2.5)
      const edge0 = Math.max(0, 1 - FIELD.fade * 2.2)
      const t = Math.min(1, Math.max(0, (radius - edge0) / (1 - edge0)))
      const level = 1 - t * t * (3 - 2 * t)
      if (level <= 0.01) continue
      if (carved && carved[(Math.min(height - 1, Math.round(cy)) * width + Math.min(width - 1, Math.round(cx))) * 4 + 3] > 127) continue
      const x = cx / feature + 12.9898
      const y = cy / feature + 78.233
      const n = (noise(x, y, 0) + 0.5 * noise(x * 2, y * 2, 0)) / 1.5
      const tone = Math.min(1, Math.max(0, (n * 0.5 + 0.5 - threshold) * gain + 0.5))
      const shape = 2 - Math.floor(Math.min(tone, 0.999999) * 3)
      ctx.globalAlpha = level
      if (shape === 0) {
        ctx.fillRect(cx - half, cy - half, half * 2, half * 2)
      } else if (shape === 1) {
        ctx.beginPath()
        ctx.arc(cx, cy, half, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.moveTo(cx, cy - half)
        ctx.lineTo(cx + half, cy + half)
        ctx.lineTo(cx - half, cy + half)
        ctx.closePath()
        ctx.fill()
      }
    }
  }
  ctx.globalAlpha = 1
}

function StaticField({ painter, paintKey }: { painter?: Painter; paintKey: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let raf = 0
    let timer: ReturnType<typeof setTimeout>
    const redraw = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => drawField(canvas, painter))
      }, 90)
    }
    const ro = new ResizeObserver(redraw)
    ro.observe(canvas)
    redraw()
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [painter, paintKey])
  return <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
}
