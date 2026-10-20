import { ImageResponse } from 'next/og'

import { CARET, layout, STROKE, VIEW_H, VIEW_Y } from '@/brand/glyphs'

const COLORS = { ink: '#F1EFEA', muted: '#7C7C82', accent: '#E53935' }

/** Social card: `/og?title=…&kind=yazı`. Also used as the default site image. */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') || '').slice(0, 120)
  const kind = (searchParams.get('kind') || '').slice(0, 24)
  const { glyphs, caretX, width } = layout()
  const markW = title ? 420 : 960
  const markH = (markW / width) * VIEW_H

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111113', padding: 72, color: COLORS.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#949498', letterSpacing: 1 }}>
          <span>{kind ? `~/${kind}` : '~/'}</span>
          <span>0xmertcan.me</span>
        </div>
        {title ? (
          <div style={{ display: 'flex', fontSize: title.length > 60 ? 56 : 72, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
        ) : null}
        <svg width={markW} height={markH} viewBox={`0 ${VIEW_Y} ${width} ${VIEW_H}`}>
          {glyphs.map((g) => (
            <path key={g.index} d={g.d} transform={`translate(${g.x} 0)`} stroke={COLORS[g.tone]} strokeWidth={STROKE} strokeLinecap="square" fill="none" />
          ))}
          <rect x={caretX} y={CARET.y} width={CARET.w} height={CARET.h} fill={COLORS.accent} />
        </svg>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
