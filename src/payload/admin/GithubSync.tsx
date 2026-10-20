'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Result = { total: number; created: number; updated: number; private: number; usedToken: boolean } | { error: string }

/** Shown above the Projects list: pulls your repositories in as draft projects. */
export function GithubSyncButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const run = async () => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/projects/github-sync', { method: 'POST', credentials: 'include' })
      const json = (await res.json()) as Result
      setResult(json)
      if (res.ok) router.refresh()
    } catch {
      setResult({ error: 'Sunucuya ulaşılamadı.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', margin: '0 0 24px', padding: '14px 16px', border: '1px solid var(--theme-elevation-150)', borderRadius: 4 }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={run} disabled={busy}>
        {busy ? 'Senkronize ediliyor…' : 'GitHub’dan senkronize et'}
      </button>
      <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }} role="status">
        {result && 'error' in result && <span style={{ color: 'var(--theme-error-500)' }}>{result.error}</span>}
        {result && !('error' in result) &&
          `${result.total} depo · ${result.created} yeni taslak · ${result.updated} güncellendi${result.usedToken ? '' : ' · yalnızca herkese açık depolar (token yok)'}`}
        {!result && 'Yeni depolar taslak olarak eklenir. Başlık, özet ve hikâyeye sonraki senkronlarda dokunulmaz; README okunmaz.'}
      </span>
    </div>
  )
}
