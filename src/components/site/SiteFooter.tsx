import Link from 'next/link'

import { BrandSymbol } from '@/brand/Wordmark'
import { getProfile, getSettings } from '@/lib/data'
import { NAV, SITE_HOST } from '@/lib/site'
import { SOCIAL_PLATFORMS } from '@/payload/globals/Profile'

export const socialLabel = (platform: string) => SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform

export async function SiteFooter() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()])
  const socials = profile.socials ?? []
  const year = new Date().getFullYear()

  return (
    <footer className="mt-32 border-t border-line">
      <div className="shell grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Ana sayfa">
            <BrandSymbol className="h-7 w-auto" aria-hidden="true" />
            <span className="font-mono text-sm text-fg">{SITE_HOST.replace(/^localhost.*/, '0xmertcan.me')}</span>
          </Link>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-muted">
            {profile.name} · {profile.role}
            {settings.footerNote ? <span className="block">{settings.footerNote}</span> : null}
          </p>
        </div>

        <nav aria-label="Alt menü" className="md:col-span-3">
          <p className="meta mb-4">./sayfalar</p>
          <ul className="space-y-2.5 text-[0.95rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="link-draw text-fg-soft hover:text-fg">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/rss.xml" className="link-draw text-fg-soft hover:text-fg">
                RSS
              </a>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="meta mb-4">./bağlantılar</p>
          {socials.length || profile.email ? (
            <ul className="space-y-2.5 text-[0.95rem]">
              {profile.email && (
                <li>
                  <a href={`mailto:${profile.email}`} className="link-draw text-fg-soft hover:text-fg">
                    {profile.email}
                  </a>
                </li>
              )}
              {socials.map((s) => (
                <li key={s.id ?? s.url}>
                  <a href={s.url} rel="me noopener" target="_blank" className="group inline-flex items-baseline gap-2 text-fg-soft hover:text-fg">
                    <span className="link-draw">{socialLabel(s.platform)}</span>
                    {s.handle && <span className="meta">{s.handle}</span>}
                    <span aria-hidden="true" className="meta transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      ↗
                    </span>
                    <span className="sr-only">(yeni sekmede açılır)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.95rem] text-muted">
              <Link href="/iletisim" className="link-quiet">
                İletişim formu
              </Link>{' '}
              üzerinden ulaşabilirsiniz.
            </p>
          )}
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta">
          © {year} {profile.name}
        </p>
        <p className="meta">
          <span className="text-faint">$</span> exit 0 <span className="text-accent-text">·</span> Ctrl/⌘ K ile gezin
        </p>
      </div>
    </footer>
  )
}
