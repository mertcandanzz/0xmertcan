import Link from 'next/link'

export const metadata = { title: '404 — bulunamadı', robots: { index: false } }

export default function NotFound() {
  return (
    <section className="shell flex min-h-[80svh] flex-col justify-center pb-16 pt-[calc(var(--header-h)+4rem)]">
      <p className="font-mono text-[0.85rem] text-muted">
        <span className="text-accent-text">❯</span> cd <span className="text-fg-soft">{'<istenen-yol>'}</span>
      </p>
      <p className="mt-2 font-mono text-[0.85rem] text-accent-text">cd: böyle bir dosya ya da dizin yok</p>
      <h1 className="mt-10 text-[clamp(4rem,16vw,12rem)] font-medium leading-[0.85] tracking-[-0.06em] text-fg">
        404<span className="caret ml-[0.04em] inline-block h-[0.8em] w-[0.06em] translate-y-[0.04em] bg-accent" aria-hidden="true" />
      </h1>
      <p className="mt-8 max-w-md text-[1.1rem] text-muted">Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Ana sayfa
        </Link>
        <Link href="/blog" className="btn btn-ghost">
          Blog
        </Link>
        <Link href="/projeler" className="btn btn-ghost">
          Projeler
        </Link>
      </div>
    </section>
  )
}
