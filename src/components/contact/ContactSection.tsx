import { socialLabel } from '@/components/site/SiteFooter'
import { SectionHeading } from '@/components/ui/SectionHeading'
import type { Profile } from '@/lib/data'

import { ContactForm } from './ContactForm'

export function ContactSection({ profile, formEnabled, index = '06', as = 'h2' }: { profile: Profile; formEnabled: boolean; index?: string; as?: 'h1' | 'h2' }) {
  const socials = profile.socials ?? []
  return (
    <section id="iletisim" aria-labelledby="iletisim-title" className="shell scroll-mt-24 py-24 md:py-32">
      <SectionHeading index={index} title="İletişim" path="~/iletisim" id="iletisim-title" as={as}>
        Bir proje, bir soru ya da yazılardan biri hakkında bir not — buradan yazabilirsiniz.
      </SectionHeading>
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-7">
          {formEnabled ? (
            <ContactForm />
          ) : (
            <p className="text-[1.05rem] text-muted">İletişim formu şu anda kapalı{profile.email || socials.length ? '; yandaki kanalları kullanabilirsiniz.' : '.'}</p>
          )}
        </div>
        {(profile.email || socials.length > 0) && (
          <aside className="md:col-span-4 md:col-start-9" aria-label="Diğer kanallar">
            <p className="meta mb-5">./kanallar</p>
            <ul className="border-t border-line">
              {profile.email && (
                <li>
                  <a href={`mailto:${profile.email}`} className="group flex items-baseline justify-between border-b border-line py-4 text-fg-soft hover:text-fg">
                    <span>E-posta</span>
                    <span className="meta group-hover:text-fg">{profile.email}</span>
                  </a>
                </li>
              )}
              {socials.map((s) => (
                <li key={s.id ?? s.url}>
                  <a href={s.url} target="_blank" rel="me noopener" className="group flex items-baseline justify-between border-b border-line py-4 text-fg-soft hover:text-fg">
                    <span>{socialLabel(s.platform)}</span>
                    <span className="meta group-hover:text-fg">
                      {s.handle || new URL(s.url).host} <span aria-hidden="true">↗</span>
                      <span className="sr-only">(yeni sekmede açılır)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  )
}
