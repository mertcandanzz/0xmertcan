'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section className="shell flex min-h-[80svh] flex-col justify-center pb-16 pt-[calc(var(--header-h)+4rem)]" role="alert">
      <p className="font-mono text-[0.85rem] text-accent-text">
        <span className="text-muted">❯</span> process exited with code 1
      </p>
      <h1 className="mt-8 text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1] tracking-[-0.04em] text-fg">Bir şeyler ters gitti.</h1>
      <p className="mt-6 max-w-md text-[1.05rem] text-muted">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek çoğu zaman yeterli.
        {error.digest && <span className="meta mt-3 block">ref: {error.digest}</span>}
      </p>
      <div className="mt-10 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Tekrar dene
        </button>
        <Link href="/" className="btn btn-ghost">
          Ana sayfa
        </Link>
      </div>
    </section>
  )
}
