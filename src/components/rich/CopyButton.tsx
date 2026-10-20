'use client'

import { useEffect, useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 1800)
    return () => clearTimeout(t)
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <button type="button" onClick={copy} className="meta rounded px-2 py-1 transition-colors hover:bg-raised hover:text-fg" aria-label="Kodu kopyala">
      <span aria-live="polite">{state === 'done' ? 'kopyalandı ✓' : state === 'error' ? 'kopyalanamadı' : 'kopyala'}</span>
    </button>
  )
}
