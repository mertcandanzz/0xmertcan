import { ImageResponse } from 'next/og'

import { CARET, GLYPHS, SYMBOL, VIEW_H, VIEW_Y } from '@/brand/glyphs'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const [outline, slash] = GLYPHS['0'].d.split(' M')
  const w = SYMBOL.caretX + 1.55
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111113' }}>
        <svg width={w * 9} height={VIEW_H * 9} viewBox={`0 ${VIEW_Y} ${w} ${VIEW_H}`}>
          <path d={outline} stroke="#F1EFEA" strokeWidth={1.4} fill="none" strokeLinecap="square" />
          <path d={'M' + slash} stroke="#E53935" strokeWidth={1.4} fill="none" strokeLinecap="square" />
          <rect x={SYMBOL.caretX} y={CARET.y} width={1.4} height={CARET.h} fill="#E53935" />
        </svg>
      </div>
    ),
    size,
  )
}
