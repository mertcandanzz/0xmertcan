/**
 * 0xmertcan glyph system.
 *
 * Every glyph is drawn as a centre-line path on a 5.6 × 10 unit cell and
 * rendered with a square-capped stroke of STROKE units. Outer edges land on
 * the cell boundary (centre-lines sit STROKE / 2 inside), so the wordmark
 * keeps a strict monospaced rhythm at any size.
 *
 * Shared by the React <Wordmark /> component and `scripts/brand.ts`, which
 * writes the static SVG files in /public/brand.
 */

export const STROKE = 1.2
export const CELL_W = 5.6
export const CELL_H = 10
export const ADVANCE = 6.8
/** Slash and caret overshoot the cap height slightly for a sharper silhouette. */
export const OVERSHOOT = 0.6

const a = STROKE / 2 // left centre-line
const b = CELL_W - STROKE / 2 // right centre-line
const t = STROKE / 2 // top centre-line
const d = CELL_H - STROKE / 2 // bottom centre-line
const m = CELL_H / 2 // mid line
const r = 1.5 // corner radius for round forms

export type GlyphTone = 'muted' | 'ink' | 'accent'

export type Glyph = {
  char: string
  d: string
  tone: GlyphTone
}

const f = (n: number) => +n.toFixed(3)
const P = (strings: TemplateStringsArray, ...values: number[]) =>
  strings.reduce((acc, s, i) => acc + s + (i < values.length ? f(values[i]) : ''), '')

export const GLYPHS: Record<string, Omit<Glyph, 'char'>> = {
  '<': { d: P`M${b - 0.4} ${t + 1.2} L${a + 0.4} ${m} L${b - 0.4} ${d - 1.2}`, tone: 'muted' },
  '>': { d: P`M${a + 0.4} ${t + 1.2} L${b - 0.4} ${m} L${a + 0.4} ${d - 1.2}`, tone: 'muted' },
  '/': { d: P`M${b} ${-OVERSHOOT + t} L${a} ${CELL_H + OVERSHOOT - t}`, tone: 'accent' },
  // Rounded zero with an inner slash — the programmer's zero, echoing "/".
  '0': {
    d:
      P`M${a + r} ${t} H${b - r} A${r} ${r} 0 0 1 ${b} ${t + r} V${d - r} A${r} ${r} 0 0 1 ${b - r} ${d} H${a + r} A${r} ${r} 0 0 1 ${a} ${d - r} V${t + r} A${r} ${r} 0 0 1 ${a + r} ${t} Z` +
      P` M${b - 1.55} ${t + 2.6} L${a + 1.55} ${d - 2.6}`,
    tone: 'ink',
  },
  X: { d: P`M${a} ${t} L${b} ${d} M${b} ${t} L${a} ${d}`, tone: 'ink' },
  M: { d: P`M${a} ${d + STROKE / 2} V${t} L${CELL_W / 2} ${m + 0.6} L${b} ${t} V${d + STROKE / 2}`, tone: 'ink' },
  E: { d: P`M${b} ${t} H${a} V${d} H${b} M${a} ${m} H${b - 0.9}`, tone: 'ink' },
  R: {
    d: P`M${a} ${d + STROKE / 2} V${t} H${b - 2.1} A2.1 2.1 0 0 1 ${b - 2.1} ${t + 4.2} H${a} M${b - 2.5} ${t + 4.2} L${b} ${d}`,
    tone: 'ink',
  },
  T: { d: P`M${a - STROKE / 2} ${t} H${b + STROKE / 2} M${CELL_W / 2} ${t} V${d + STROKE / 2}`, tone: 'ink' },
  C: {
    d: P`M${b + STROKE / 2} ${t} H${a + r} A${r} ${r} 0 0 0 ${a} ${t + r} V${d - r} A${r} ${r} 0 0 0 ${a + r} ${d} H${b + STROKE / 2}`,
    tone: 'ink',
  },
  // Arched A: no apex, a terminal-flavoured stencil form.
  A: {
    d: P`M${a} ${d + STROKE / 2} V${t + r} A${r} ${r} 0 0 1 ${a + r} ${t} H${b - r} A${r} ${r} 0 0 1 ${b} ${t + r} V${d + STROKE / 2} M${a} ${m + 0.4} H${b}`,
    tone: 'ink',
  },
  N: { d: P`M${a} ${d + STROKE / 2} V${t} L${b} ${d} V${t - STROKE / 2}`, tone: 'ink' },
}

export const SIGNATURE = '</0XMERTCAN>'

export type LaidGlyph = Glyph & { x: number; index: number }

export function layout(text: string = SIGNATURE): { glyphs: LaidGlyph[]; caretX: number; width: number } {
  const glyphs = Array.from(text).map((char, index) => {
    const g = GLYPHS[char]
    if (!g) throw new Error(`No glyph for "${char}"`)
    return { char, ...g, x: index * ADVANCE, index }
  })
  const lastRight = (glyphs.length - 1) * ADVANCE + CELL_W
  const caretX = lastRight + 1.3
  return { glyphs, caretX, width: caretX + STROKE }
}

/** Vertical bounds including overshoot, used as the SVG viewBox. */
export const VIEW_Y = -OVERSHOOT
export const VIEW_H = CELL_H + OVERSHOOT * 2

export const CARET = { y: -OVERSHOOT, h: CELL_H + OVERSHOOT * 2, w: STROKE }

/** Compact symbol: slashed zero with a caret — the mark reduced to its two ideas. */
export const SYMBOL = {
  width: 10,
  height: 11.2,
  zero: GLYPHS['0'].d,
  caretX: CELL_W + 1.6,
}

export const PALETTE = {
  dark: { bg: '#111113', ink: '#F1EFEA', muted: '#7C7C82', accent: '#E53935' },
  light: { bg: '#F1EFEA', ink: '#141416', muted: '#7A7A80', accent: '#D32F2F' },
}
