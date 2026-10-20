import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [posts, projects] = await Promise.all([
    payload.find({ collection: 'posts', limit: 1000, depth: 0, overrideAccess: false, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'projects', limit: 500, depth: 0, overrideAccess: false, select: { slug: true, updatedAt: true } }),
  ])
  const now = new Date()
  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/projeler'), lastModified: now, priority: 0.8 },
    { url: absoluteUrl('/blog'), lastModified: now, priority: 0.8 },
    { url: absoluteUrl('/hakkimda'), priority: 0.6 },
    { url: absoluteUrl('/iletisim'), priority: 0.4 },
    ...projects.docs.map((p) => ({ url: absoluteUrl(`/projeler/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
    ...posts.docs.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
  ]
}
