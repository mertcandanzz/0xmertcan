import 'server-only'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Category, Media, Post, Profile, Project, Setting, Tag } from '@/payload-types'

export const getPayloadClient = cache(() => getPayload({ config }))

/** The signed-in admin (if any) for the current request. Used only for previews. */
export const getViewer = cache(async () => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return user ?? null
})

export const getProfile = cache(async (): Promise<Profile> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'profile', depth: 1, overrideAccess: false })
})

export const getSettings = cache(async (): Promise<Setting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'settings', depth: 1, overrideAccess: false })
})

// Public reads never pass a user, so collection access limits results to
// published documents. Previews opt in to drafts explicitly.

export const getProjects = cache(async ({ featured }: { featured?: boolean } = {}) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'projects',
    where: featured ? { featured: { equals: true } } : undefined,
    sort: ['order', '-year'],
    depth: 1,
    limit: 100,
    overrideAccess: false,
  })
  return res.docs
})

export async function getProject(slug: string, { draft = false } = {}) {
  const payload = await getPayloadClient()
  const user = draft ? await getViewer() : null
  const res = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    draft: Boolean(user),
    overrideAccess: false,
    user,
  })
  return res.docs[0] ?? null
}

export type PostQuery = { q?: string; category?: string; tag?: string; page?: number; limit?: number }

export async function getPosts({ q, category, tag, page = 1, limit = 12 }: PostQuery = {}) {
  const payload = await getPayloadClient()
  const and: Where[] = []
  const term = q?.trim().toLocaleLowerCase('tr').slice(0, 80)
  if (term) and.push({ or: [{ title: { like: term } }, { excerpt: { like: term } }, { searchText: { like: term } }] })
  if (category) and.push({ 'category.slug': { equals: category } })
  if (tag) and.push({ 'tags.slug': { equals: tag } })
  return payload.find({
    collection: 'posts',
    where: and.length ? { and } : undefined,
    sort: '-publishedAt',
    depth: 1,
    page,
    limit,
    overrideAccess: false,
    select: { title: true, slug: true, excerpt: true, publishedAt: true, updatedAt: true, readingTime: true, category: true, tags: true, coverImage: true, isExample: true },
  })
}

export async function getPost(slug: string, { draft = false } = {}) {
  const payload = await getPayloadClient()
  const user = draft ? await getViewer() : null
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    draft: Boolean(user),
    overrideAccess: false,
    user,
  })
  return res.docs[0] ?? null
}

export async function getRelatedPosts(post: Post, limit = 3) {
  const payload = await getPayloadClient()
  const tagIds = (post.tags ?? []).map((t) => (typeof t === 'object' ? t.id : t))
  const categoryId = typeof post.category === 'object' ? post.category?.id : post.category
  const or: Where[] = []
  if (categoryId) or.push({ category: { equals: categoryId } })
  if (tagIds.length) or.push({ tags: { in: tagIds } })
  const res = await payload.find({
    collection: 'posts',
    where: { and: [{ id: { not_equals: post.id } }, ...(or.length ? [{ or }] : [])] },
    sort: '-publishedAt',
    depth: 1,
    limit,
    overrideAccess: false,
  })
  return res.docs
}

export const getTaxonomy = cache(async () => {
  const payload = await getPayloadClient()
  const [categories, tags, posts] = await Promise.all([
    payload.find({ collection: 'categories', limit: 100, sort: 'title', depth: 0, overrideAccess: false }),
    payload.find({ collection: 'tags', limit: 200, sort: 'title', depth: 0, overrideAccess: false }),
    payload.find({ collection: 'posts', limit: 1000, depth: 0, overrideAccess: false, select: { category: true, tags: true } }),
  ])
  // Only list taxonomy that has at least one published post.
  const usedCats = new Set(posts.docs.map((p) => p.category).filter(Boolean))
  const usedTags = new Set(posts.docs.flatMap((p) => p.tags ?? []))
  return {
    categories: categories.docs.filter((c) => usedCats.has(c.id)) as Category[],
    tags: tags.docs.filter((t) => usedTags.has(t.id)) as Tag[],
  }
})

/** Lightweight index for the command palette. */
export const getSearchIndex = cache(async () => {
  const payload = await getPayloadClient()
  const [posts, projects] = await Promise.all([
    payload.find({ collection: 'posts', limit: 200, depth: 0, sort: '-publishedAt', overrideAccess: false, select: { title: true, slug: true, excerpt: true } }),
    payload.find({ collection: 'projects', limit: 100, depth: 0, sort: 'order', overrideAccess: false, select: { title: true, slug: true, summary: true } }),
  ])
  return {
    posts: posts.docs.map((p) => ({ title: p.title, href: `/blog/${p.slug}`, hint: p.excerpt })),
    projects: projects.docs.map((p) => ({ title: p.title, href: `/projeler/${p.slug}`, hint: p.summary })),
  }
})

/** Payload returns absolute URLs (serverURL); same-origin files are made relative for next/image. */
export function relUrl<T extends string | null | undefined>(url: T): T {
  if (!url) return url
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  return (origin && url.startsWith(origin) ? url.slice(origin.length) || '/' : url) as T
}

export function media(value: unknown): Media | null {
  if (!value || typeof value !== 'object' || !('url' in value)) return null
  const m = value as Media
  const sizes = Object.fromEntries(Object.entries(m.sizes ?? {}).map(([k, v]) => [k, v ? { ...v, url: relUrl(v.url) } : v]))
  return { ...m, url: relUrl(m.url), sizes: sizes as Media['sizes'] }
}

export type { Category, Post, Profile, Project, Tag }
