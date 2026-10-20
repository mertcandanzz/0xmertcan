import { BrandSymbol, Wordmark } from '../../brand/Wordmark'

const tones = { ink: 'var(--theme-elevation-1000)', muted: 'var(--theme-elevation-500)', accent: '#E53935' }

/** Login screen logo. */
export function AdminLogo() {
  return (
    <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}>
      <Wordmark tones={tones} style={{ width: 240, height: 'auto' }} />
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', color: 'var(--theme-elevation-500)' }}>
        ~/admin — içerik yönetimi
      </span>
    </div>
  )
}

/** Compact nav icon. */
export function AdminIcon() {
  return <BrandSymbol tones={tones} style={{ width: 22, height: 22 }} />
}
