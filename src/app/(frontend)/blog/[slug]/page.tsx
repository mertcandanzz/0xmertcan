import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostArticle } from '@/components/blog/PostArticle'
import { getPost, getProfile, getRelatedPosts, media } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Bulunamadı' }
  const meta = post.meta
  const img = media(meta?.image) ?? media(post.coverImage)
  const title = meta?.title?.replace(/ · 0xmertcan$/, '') || post.title
  return {
    title,
    description: meta?.description || post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      images: img?.url ? [{ url: img.sizes?.og?.url || img.url, width: 1200, height: 630, alt: img.alt }] : [`/og?title=${encodeURIComponent(post.title)}&kind=yazı`],
    },
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  const [related, profile] = await Promise.all([getRelatedPosts(post), getProfile()])
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: profile.name, url: absoluteUrl('/') },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PostArticle post={post} related={related} />
    </>
  )
}
