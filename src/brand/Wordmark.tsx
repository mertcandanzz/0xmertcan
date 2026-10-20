import type { CSSProperties, SVGProps } from 'react'

import { ADVANCE, CARET, GLYPHS, layout, STROKE, SYMBOL, VIEW_H, VIEW_Y } from './glyphs'

type Tones = { ink?: string; muted?: string; accent?: string }

const DEFAULT_TONES: Required<Tones> = {
  ink: 'var(--brand-ink, currentColor)',
  muted: 'var(--brand-muted, currentColor)',
  accent: 'var(--brand-accent, currentColor)',
}

type WordmarkProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  tones?: Tones
  /** Number of visible glyphs (for the typed intro). Defaults to all. */
  visible?: number
  caretClassName?: string
  title?: string
}

const { glyphs, caretX, width } = layout()

export const WORDMARK_RATIO = width / VIEW_H

/**
 * Vector wordmark `</0XMERTCAN>|`. Pure SVG, so it is identical at hero and
 * navbar scale and never waits on a web font.
 */
export function Wordmark({
  tones,
  visible = glyphs.length,
  caretClassName,
  title = '0xmertcan',
  style,
  ...rest
}: WordmarkProps) {
  const t = { ...DEFAULT_TONES, ...tones }
  const caretAt = visible >= glyphs.length ? caretX : visible * ADVANCE + 0.2
  return (
    <svg
      viewBox={`0 ${VIEW_Y} ${width} ${VIEW_H}`}
      role="img"
      aria-label={title}
      style={{ overflow: 'visible', ...style } as CSSProperties}
      {...rest}
    >
      <g className="sig-ink" fill="none" strokeWidth={STROKE} strokeLinecap="square" strokeLinejoin="miter">
        {glyphs.map((g) => (
          <path
            key={g.index}
            d={g.d}
            transform={`translate(${g.x} 0)`}
            stroke={t[g.tone]}
            style={{ opacity: g.index < visible ? 1 : 0 }}
          />
        ))}
      </g>
      <rect className={caretClassName} x={caretAt} y={CARET.y} width={CARET.w} height={CARET.h} fill={t.accent} />
    </svg>
  )
}

export function BrandSymbol({ tones, title = '0xmertcan', ...rest }: Omit<SVGProps<SVGSVGElement>, 'children'> & { tones?: Tones; title?: string }) {
  const t = { ...DEFAULT_TONES, ...tones }
  const [outline, slash] = GLYPHS['0'].d.split(' M')
  return (
    <svg viewBox={`0 ${VIEW_Y} ${SYMBOL.caretX + STROKE} ${VIEW_H}`} role="img" aria-label={title} {...rest}>
      <g fill="none" strokeWidth={STROKE} strokeLinecap="square">
        <path d={outline} stroke={t.ink} />
        <path d={'M' + slash} stroke={t.accent} />
      </g>
      <rect x={SYMBOL.caretX} y={CARET.y} width={CARET.w} height={CARET.h} fill={t.accent} />
    </svg>
  )
}
