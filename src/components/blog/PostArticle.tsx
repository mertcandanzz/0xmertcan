import Image from 'next/image'
import Link from 'next/link'

import { RichText } from '@/components/rich/RichText'
import { media, type Category, type Post, type Tag } from '@/lib/data'
import { extractToc } from '@/lib/lexical'
import { formatDate, sameDay } from '@/lib/site'

import { ReadingProgress, TableOfContents } from './ArticleChrome'
import { PostList } from './PostList'

export function PostArticle({ post, related = [] }: { post: Post; related?: Post[] }) {
  const category = typeof post.category === 'object' ? (post.category as Category | null) : null
  const tags = (post.tags ?? []).filter((t): t is Tag => typeof t === 'object')
  const cover = media(post.coverImage)
  const toc = extractToc(post.content as never)
  const showToc = toc.length >= 3
  const updated = post.updatedAt && !sameDay(post.updatedAt, post.publishedAt) ? post.updatedAt : null

  return (
    <>
      <ReadingProgress targetId="article-body" />
      <article className="pb-10 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
        <header className="shell">
          <nav aria-label="İçerik yolu" className="meta mb-10 flex items-center gap-2">
            <Link href="/blog" className="link-quiet">
              ~/blog
            </Link>
            {category && (
              <>
                <span className="text-faint">/</span>
                <Link href={`/blog?kategori=${category.slug}`} className="link-quiet">
                  {category.slug}
                </Link>
              </>
            )}
          </nav>
          <div className="max-w-4xl">
            {post.isExample && <p className="badge-example mb-6">örnek içerik</p>}
            <h1 className="text-[clamp(2.2rem,5.6vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.04em] text-fg">{post.title}</h1>
            <p className="mt-6 max-w-2xl text-[1.15rem] leading-relaxed text-fg-soft md:text-[1.25rem]">{post.excerpt}</p>
          </div>
          <dl className="meta mt-10 flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-4">
            <div className="flex gap-2">
              <dt className="text-faint">yayın</dt>
              <dd className="text-fg-soft">
                <time dateTime={post.publishedAt ?? undefined}>{post.publishedAt ? formatDate(post.publishedAt) : 'yayınlanmadı'}</time>
              </dd>
            </div>
            {updated && (
              <div className="flex gap-2">
                <dt className="text-faint">güncelleme</dt>
                <dd className="text-fg-soft">
                  <time dateTime={updated}>{formatDate(updated)}</time>
                </dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-faint">okuma</dt>
              <dd className="text-fg-soft">{post.readingTime ?? 1} dk</dd>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2">
                <dt className="text-faint">etiket</dt>
                <dd className="flex flex-wrap gap-x-2">
                  {tags.map((t) => (
                    <Link key={t.id} href={`/blog?etiket=${t.slug}`} className="link-quiet text-fg-soft">
                      #{t.slug}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </header>

        {cover?.url && (
          <figure className="shell mt-12">
            <Image
              src={cover.sizes?.wide?.url || cover.url}
              alt={cover.alt}
              width={cover.sizes?.wide?.width || cover.width || 1800}
              height={cover.sizes?.wide?.height || cover.height || 1100}
              sizes="100vw"
              priority
              className="h-auto max-h-[70vh] w-full border border-line object-cover"
            />
            {cover.caption && <figcaption className="meta mt-3">{cover.caption}</figcaption>}
          </figure>
        )}

        <div className="shell mt-14 grid gap-12 md:mt-20 lg:grid-cols-12">
          <div id="article-body" className="min-w-0 lg:col-span-8 xl:col-span-7 xl:col-start-2">
            <RichText data={post.content} anchors />
          </div>
          {showToc && (
            <aside className="order-first lg:order-none lg:col-span-3 lg:col-start-10">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
                <details className="group border border-line p-4 lg:hidden">
                  <summary className="meta cursor-pointer list-none text-fg-soft">
                    içindekiler <span className="text-faint group-open:hidden">+</span>
                    <span className="hidden text-faint group-open:inline">−</span>
                  </summary>
                  <div className="mt-4">
                    <TableOfContents items={toc} />
                  </div>
                </details>
                <div className="hidden lg:block">
                  <TableOfContents items={toc} />
                </div>
              </div>
            </aside>
          )}
        </div>

        <footer className="shell mt-20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <Link href="/blog" className="group meta inline-flex items-center gap-2 text-fg-soft hover:text-fg">
              <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
                ←
              </span>
              tüm yazılar
            </Link>
            <p className="meta">son: {formatDate(post.updatedAt)}</p>
          </div>
        </footer>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="ilgili" className="shell mt-16">
          <p className="meta mb-2">ilgili</p>
          <h2 id="ilgili" className="mb-8 text-[1.8rem] font-medium tracking-tight text-fg">
            Bunlar da ilginizi çekebilir
          </h2>
          <PostList posts={related} />
        </section>
      )}
    </>
  )
}
