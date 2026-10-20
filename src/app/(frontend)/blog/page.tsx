import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { BlogSearch } from '@/components/blog/BlogSearch'
import { PostList } from '@/components/blog/PostList'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPosts, getTaxonomy } from '@/lib/data'

type Search = Promise<{ q?: string; kategori?: string; etiket?: string; sayfa?: string }>

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { q, kategori, etiket } = await searchParams
  const filtered = Boolean(q || kategori || etiket)
  return {
    title: 'Blog',
    description: 'Yazılım, sistemler ve arayüzler üzerine yazılar.',
    alternates: { canonical: '/blog' },
    // Filtered/search result pages should not compete with the index.
    robots: filtered ? { index: false, follow: true } : undefined,
  }
}

export default async function BlogPage({ searchParams }: { searchParams: Search }) {
  const { q, kategori, etiket, sayfa } = await searchParams
  const page = Math.max(1, Number(sayfa) || 1)
  const [result, taxonomy] = await Promise.all([getPosts({ q, category: kategori, tag: etiket, page, limit: 10 }), getTaxonomy()])
  const filtered = Boolean(q || kategori || etiket)

  const href = (next: Record<string, string | null | undefined>) => {
    const qs = new URLSearchParams()
    const merged = { q, kategori, etiket, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v)
    const s = qs.toString()
    return s ? `/blog?${s}` : '/blog'
  }

  return (
    <div className="shell pb-10 pt-[calc(var(--header-h)+4rem)] md:pt-[calc(var(--header-h)+6rem)]">
      <SectionHeading index="05" title="Blog" path="~/blog" as="h1">
        Uzun notlar, kısa keşifler. Arayın, kategoriye ya da etikete göre süzün.{' '}
        <a href="/rss.xml" className="link-quiet whitespace-nowrap">
          RSS
        </a>
      </SectionHeading>

      <div className="grid gap-12 md:grid-cols-12">
        <aside className="md:col-span-3" aria-label="Filtreler">
          <div className="md:sticky md:top-[calc(var(--header-h)+2rem)]">
            <Suspense fallback={<div className="field h-[3.2rem]" />}>
              <BlogSearch />
            </Suspense>

            {taxonomy.categories.length > 0 && (
              <nav aria-label="Kategoriler" className="mt-10">
                <p className="meta mb-3">kategori</p>
                <ul className="space-y-1">
                  <li>
                    <Link href={href({ kategori: null, sayfa: null })} aria-current={!kategori ? 'true' : undefined} className="flex justify-between py-1 text-[0.95rem] text-muted hover:text-fg aria-[current=true]:text-fg">
                      <span>Tümü</span>
                      {!kategori && <span className="text-accent-text">●</span>}
                    </Link>
                  </li>
                  {taxonomy.categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={href({ kategori: kategori === c.slug ? null : c.slug, sayfa: null })}
                        aria-current={kategori === c.slug ? 'true' : undefined}
                        className="flex justify-between py-1 text-[0.95rem] text-muted hover:text-fg aria-[current=true]:text-fg"
                      >
                        <span>{c.title}</span>
                        {kategori === c.slug && <span className="text-accent-text">●</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {taxonomy.tags.length > 0 && (
              <div className="mt-10">
                <p className="meta mb-3">etiket</p>
                <ul className="flex flex-wrap gap-2" aria-label="Etiketler">
                  {taxonomy.tags.map((t) => (
                    <li key={t.id}>
                      <Link href={href({ etiket: etiket === t.slug ? null : t.slug, sayfa: null })} className="chip" aria-current={etiket === t.slug ? 'true' : undefined}>
                        #{t.slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <section className="md:col-span-9" aria-label="Yazılar">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="meta" aria-live="polite">
              {result.totalDocs} yazı
              {q ? ` · “${q}”` : ''}
              {kategori ? ` · ${taxonomy.categories.find((c) => c.slug === kategori)?.title ?? kategori}` : ''}
              {etiket ? ` · #${etiket}` : ''}
            </p>
            {filtered && (
              <Link href="/blog" className="meta link-quiet">
                filtreleri temizle ×
              </Link>
            )}
          </div>

          {result.docs.length ? (
            <PostList posts={result.docs} headingLevel="h2" />
          ) : filtered ? (
            <div className="border border-dashed border-line-strong px-6 py-20 text-center">
              <p className="font-mono text-sm text-muted">
                <span className="text-accent-text">❯</span> grep -ri {JSON.stringify(q ?? '')} ~/blog
                <span className="block pt-2 text-faint">0 eşleşme</span>
              </p>
              <p className="mt-5 text-[1.1rem] text-fg">Bu aramayla eşleşen yazı bulunamadı.</p>
              <p className="mt-2 text-muted">Daha kısa bir kelime deneyin ya da filtreleri kaldırın.</p>
              <Link href="/blog" className="btn btn-ghost mt-8">
                Tüm yazılar
              </Link>
            </div>
          ) : (
            <div className="border border-dashed border-line-strong px-6 py-20 text-center">
              <p className="text-[1.1rem] text-fg">Henüz yayınlanmış yazı yok.</p>
              <p className="meta mt-2">İlk yazı hazırlanıyor.</p>
            </div>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Sayfalar" className="mt-10 flex items-center justify-between">
              {result.hasPrevPage ? (
                <Link href={href({ sayfa: String(page - 1) })} className="btn btn-ghost" rel="prev">
                  ← Yeni yazılar
                </Link>
              ) : (
                <span />
              )}
              <span className="meta">
                {page} / {result.totalPages}
              </span>
              {result.hasNextPage ? (
                <Link href={href({ sayfa: String(page + 1) })} className="btn btn-ghost" rel="next">
                  Eski yazılar →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  )
}
