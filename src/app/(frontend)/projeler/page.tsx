import type { Metadata } from 'next'
import Link from 'next/link'

import { ProjectMeta, StackList } from '@/components/projects/ProjectIndex'
import { ProjectPreview } from '@/components/projects/ProjectPreview'
import { Reveal } from '@/components/ui/motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getProjects } from '@/lib/data'
import { PROJECT_STATUS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Projeler',
  description: 'Tüm projeler: durum, yıl ve teknolojiye göre filtrelenebilir arşiv.',
  alternates: { canonical: '/projeler' },
}

type Search = Promise<{ durum?: string; teknoloji?: string }>

export default async function ProjectsPage({ searchParams }: { searchParams: Search }) {
  const { durum, teknoloji } = await searchParams
  const all = await getProjects()

  const techCount = new Map<string, number>()
  for (const p of all) for (const s of p.stack ?? []) techCount.set(s.name, (techCount.get(s.name) ?? 0) + 1)
  const techs = [...techCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr')).map(([n]) => n)
  const statuses = Object.keys(PROJECT_STATUS).filter((s) => all.some((p) => p.status === s))

  const list = all.filter((p) => (!durum || p.status === durum) && (!teknoloji || (p.stack ?? []).some((s) => s.name === teknoloji)))

  const href = (next: { durum?: string | null; teknoloji?: string | null }) => {
    const q = new URLSearchParams()
    const d = next.durum === undefined ? durum : next.durum
    const t = next.teknoloji === undefined ? teknoloji : next.teknoloji
    if (d) q.set('durum', d)
    if (t) q.set('teknoloji', t)
    const s = q.toString()
    return s ? `/projeler?${s}` : '/projeler'
  }

  return (
    <div className="shell pb-10 pt-[calc(var(--header-h)+4rem)] md:pt-[calc(var(--header-h)+6rem)]">
      <SectionHeading index="02" title="Projeler" path="~/projeler" as="h1">
        Yayında olanlar, sürenler ve rafa kalkanlar. Durum ya da teknolojiye göre süzün.
      </SectionHeading>

      <div className="mb-12 grid gap-5 border-y border-line py-5 md:grid-cols-[8rem_1fr] md:gap-y-4" role="group" aria-label="Proje filtreleri">
        <p className="meta pt-1.5">durum</p>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ durum: null })} className="chip" aria-current={!durum ? 'true' : undefined}>
            tümü <span className="text-faint">{all.length}</span>
          </Link>
          {statuses.map((s) => (
            <Link key={s} href={href({ durum: durum === s ? null : s })} className="chip" aria-current={durum === s ? 'true' : undefined}>
              {PROJECT_STATUS[s].toLocaleLowerCase('tr')} <span className="text-faint">{all.filter((p) => p.status === s).length}</span>
            </Link>
          ))}
        </div>
        {techs.length > 0 && (
          <>
            <p className="meta pt-1.5">teknoloji</p>
            <div className="flex flex-wrap gap-2">
              {techs.map((t) => (
                <Link key={t} href={href({ teknoloji: teknoloji === t ? null : t })} className="chip" aria-current={teknoloji === t ? 'true' : undefined}>
                  {t}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="meta mb-6" aria-live="polite">
        {list.length} proje{durum || teknoloji ? ' · filtre uygulandı' : ''}
      </p>

      {list.length ? (
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {list.map((p, i) => (
            <li key={p.id} className={i % 3 === 0 ? 'md:col-span-2' : ''}>
              <Reveal distance={20} delay={(i % 2) * 0.06}>
                <Link href={`/projeler/${p.slug}`} className="group block">
                  <div className={`overflow-hidden border border-line ${i % 3 === 0 ? 'md:grid md:grid-cols-12' : ''}`}>
                    <div className={i % 3 === 0 ? 'md:col-span-8' : ''}>
                      <ProjectPreview project={p} index={i} sizes={i % 3 === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 50vw, 100vw'} />
                    </div>
                    {i % 3 === 0 && (
                      <div className="hidden flex-col justify-between border-l border-line p-8 md:col-span-4 md:flex">
                        <span className="font-mono text-[0.8rem] text-accent-text">{String(i + 1).padStart(2, '0')}</span>
                        <StackList project={p} />
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-[1.5rem] font-medium tracking-[-0.02em] text-fg md:text-[1.85rem]">
                        <span className="link-draw">{p.title}</span>
                      </h2>
                      <p className="mt-2 max-w-xl text-[0.98rem] leading-relaxed text-muted">{p.summary}</p>
                    </div>
                    <span aria-hidden="true" className="mt-2 font-mono text-fg-soft transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  <ProjectMeta project={p} className="mt-4" />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-dashed border-line-strong px-6 py-20 text-center">
          <p className="font-mono text-sm text-muted">
            <span className="text-accent-text">❯</span> ls ~/projeler{durum ? ` --durum=${durum}` : ''}
            {teknoloji ? ` --teknoloji=${teknoloji}` : ''}
          </p>
          <p className="mt-4 text-[1.1rem] text-fg">Bu filtrelerle eşleşen proje yok.</p>
          <Link href="/projeler" className="btn btn-ghost mt-8">
            Filtreleri temizle
          </Link>
        </div>
      )}
    </div>
  )
}
