import { getPayloadClient, getProfile, getSettings } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export async function GET() {
  const payload = await getPayloadClient()
  const [settings, profile, posts] = await Promise.all([
    getSettings(),
    getProfile(),
    payload.find({ collection: 'posts', limit: 50, depth: 1, sort: '-publishedAt', overrideAccess: false }),
  ])
  const items = posts.docs
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)
      const category = typeof p.category === 'object' && p.category ? `<category>${esc(p.category.title)}</category>` : ''
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description>${category}</item>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(settings.siteTitle)} — Blog</title><link>${absoluteUrl('/blog')}</link><description>${esc(settings.siteDescription)}</description><language>tr</language><managingEditor>${esc(profile.name)}</managingEditor><atom:link href="${absoluteUrl('/rss.xml')}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } })
}
