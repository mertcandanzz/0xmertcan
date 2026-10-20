import Link from 'next/link'

import { Reveal } from '@/components/ui/motion'
import type { Category, Post } from '@/lib/data'
import { formatStamp } from '@/lib/site'

type ListPost = Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt' | 'readingTime' | 'category' | 'isExample'>

/** Dated, ruled list. Title in sans for reading; metadata in mono. */
export function PostList({ posts, headingLevel = 'h3' }: { posts: ListPost[]; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel
  return (
    <ul className="border-t border-line">
      {posts.map((post, i) => {
        const category = typeof post.category === 'object' ? (post.category as Category | null) : null
        return (
          <li key={post.id}>
            <Reveal distance={14} delay={Math.min(i, 6) * 0.04}>
              <Link href={`/blog/${post.slug}`} className="group grid gap-2 border-b border-line py-7 outline-offset-[-2px] md:grid-cols-12 md:gap-6 md:py-9">
                <p className="meta flex gap-3 md:col-span-3 md:flex-col md:gap-1.5">
                  <time dateTime={post.publishedAt ?? undefined} className="text-fg-soft">
                    {formatStamp(post.publishedAt)}
                  </time>
                  <span>{post.readingTime ?? 1} dk okuma</span>
                </p>
                <div className="md:col-span-8">
                  <H className="text-[1.3rem] font-medium leading-snug tracking-[-0.015em] text-fg transition-colors group-hover:text-white md:text-[1.6rem]">
                    <span className="bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-[length:0_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
                      {post.title}
                    </span>
                  </H>
                  <p className="mt-2.5 max-w-2xl text-[0.98rem] leading-relaxed text-muted">{post.excerpt}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-3">
                    {category && <span className="meta text-fg-soft">#{category.slug}</span>}
                    {post.isExample && <span className="badge-example">örnek</span>}
                  </p>
                </div>
                <span aria-hidden="true" className="hidden self-center justify-self-end font-mono text-fg-soft transition-transform duration-300 group-hover:translate-x-1 md:col-span-1 md:block">
                  →
                </span>
              </Link>
            </Reveal>
          </li>
        )
      })}
    </ul>
  )
}
