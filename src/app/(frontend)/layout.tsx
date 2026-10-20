import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import { CommandPalette } from '@/components/site/CommandPalette'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SmoothScroll } from '@/components/site/SmoothScroll'
import { getProfile, getSearchIndex, getSettings, media } from '@/lib/data'
import { NAV, SITE_URL } from '@/lib/site'

import './globals.css'

const geist = Geist({ subsets: ['latin', 'latin-ext'], variable: '--font-geist', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-geist-mono', display: 'swap' })

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()])
  const og = media(settings.ogImage)
  const title = settings.siteTitle || '0xmertcan'
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${title} — ${profile.name}`, template: `%s · ${title}` },
    description: settings.siteDescription,
    applicationName: title,
    authors: [{ name: profile.name, url: SITE_URL }],
    alternates: { canonical: '/', types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${title} — Blog` }] } },
    openGraph: {
      type: 'website',
      siteName: title,
      locale: 'tr_TR',
      url: SITE_URL,
      images: og?.url ? [{ url: og.sizes?.og?.url || og.url, width: 1200, height: 630, alt: og.alt }] : [{ url: '/og', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: '#111113',
  colorScheme: 'dark',
}

// Runs before first paint: decides whether the typed intro plays (home only,
// at most every 12h, never with reduced motion) so nothing flashes.
const INTRO_SCRIPT = `try{var d=document.documentElement,m=matchMedia('(prefers-reduced-motion: reduce)').matches,t=+localStorage.getItem('oxm:intro-seen')||0;if(location.pathname==='/'&&!m&&Date.now()-t>432e5&&scrollY<10)d.setAttribute('data-intro','')}catch(e){}`

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const index = await getSearchIndex()
  const pages = [
    { title: 'Ana sayfa', href: '/', hint: 'Giriş' },
    ...NAV.map((n) => ({ title: n.label, href: n.href })),
    { title: 'RSS akışı', href: '/rss.xml', hint: 'Blog yazılarına abone olun' },
  ]
  return (
    <html lang="tr" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Must run during HTML parse (before first paint), so it is inlined rather than next/script. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <SmoothScroll />
        <SiteHeader />
        <main id="icerik" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <CommandPalette pages={pages} projects={index.projects} posts={index.posts} />
      </body>
    </html>
  )
}
