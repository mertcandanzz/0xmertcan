import Link from 'next/link'

import { PostList } from '@/components/blog/PostList'
import { ContactSection } from '@/components/contact/ContactSection'
import { Drift, IntroScene, TiltIn } from '@/components/cinema/Cinema'
import { Hero } from '@/components/home/Hero'
import { FeaturedProject, ProjectRows } from '@/components/projects/ProjectIndex'
import { RichText } from '@/components/rich/RichText'
import { Reveal } from '@/components/ui/motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getPosts, getProfile, getProjects, getSettings } from '@/lib/data'

export default async function HomePage() {
  const [profile, settings, featured, posts] = await Promise.all([getProfile(), getSettings(), getProjects({ featured: true }), getPosts({ limit: 4 })])
  const [lead, ...rest] = featured
  const principles = profile.principles ?? []
  const stack = profile.stack ?? []
  const interests = profile.interests ?? []

  return (
    <>
      <Hero name={profile.name} role={profile.role} location={profile.location} availability={profile.availability} background={settings.heroBackground ?? 'topography'} />

      {/* 01 — intro: pinned statement, read word by word */}
      <IntroScene text={profile.intro} />

      {/* 02 — projects */}
      <section aria-labelledby="projeler-title" className="shell py-20 md:py-28">
        <SectionHeading index="02" title="Seçilmiş projeler" path="~/projeler" id="projeler-title" action={{ href: '/projeler', label: 'Tüm projeler' }} />
        {lead ? (
          <div className="grid gap-14">
            <FeaturedProject project={lead} index={0} />
            {rest.length > 0 && <ProjectRows projects={rest} offset={1} />}
          </div>
        ) : (
          <EmptyNote>Henüz öne çıkarılmış proje yok.</EmptyNote>
        )}
      </section>

      {/* 03 — about & approach */}
      <section aria-labelledby="yaklasim-title" className="shell py-20 md:py-28">
        <SectionHeading index="03" title="Hakkımda ve yaklaşım" path="~/hakkimda" id="yaklasim-title" action={{ href: '/hakkimda', label: 'Devamı' }} />
        <div className="grid gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-6">
            {profile.bio ? <RichText data={profile.bio} className="prose-oxm" /> : <p className="text-muted">{profile.intro}</p>}
          </Reveal>
          {principles.length > 0 && (
            <Drift className="md:col-span-5 md:col-start-8" from={64} to={-64}>
            <ol>
              {principles.map((p, i) => (
                <li key={p.id ?? i} className="border-t border-line py-6 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-6">
                  <Reveal distance={14} delay={i * 0.06}>
                    <p className="meta mb-2 text-accent-text">{'// '}{String(i + 1).padStart(2, '0')}</p>
                    <h3 className="text-[1.15rem] font-medium tracking-tight text-fg">{p.title}</h3>
                    <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">{p.body}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
            </Drift>
          )}
        </div>
      </section>

      {/* 04 — stack & interests */}
      {(stack.length > 0 || interests.length > 0) && (
        <section aria-labelledby="stack-title" className="shell py-20 md:py-28">
          <SectionHeading index="04" title="Teknolojiler ve ilgi alanları" path="~/stack.toml" id="stack-title" />
          <div className="grid gap-14 md:grid-cols-12">
            {stack.length > 0 && (
              <TiltIn className="md:col-span-7">
                <div className="overflow-hidden rounded-[2px] border border-line bg-[#141416]">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2">
                    <span className="meta">stack.toml</span>
                    <span className="meta">{stack.length} grup</span>
                  </div>
                  <dl className="divide-y divide-line font-mono text-[0.85rem]">
                    {stack.map((g, i) => (
                      <div key={g.id ?? i} className="grid gap-2 px-4 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                        <dt className="text-accent-text">[{g.group}]</dt>
                        <dd className="text-fg-soft">
                          <span className="flex flex-wrap gap-x-2 gap-y-1">
                            {g.items
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((item, j, arr) => (
                                <span key={item}>
                                  <span className="text-faint">&quot;</span>
                                  {item}
                                  <span className="text-faint">&quot;{j < arr.length - 1 ? ',' : ''}</span>
                                </span>
                              ))}
                          </span>
                          {g.note && <span className="mt-1.5 block font-sans text-[0.82rem] text-faint"># {g.note}</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </TiltIn>
            )}
            {interests.length > 0 && (
              <div className="md:col-span-4 md:col-start-9">
                <p className="meta mb-5">./ilgi-alanları</p>
                <ul className="border-t border-line">
                  {interests.map((it, i) => (
                    <li key={it.id ?? i} className="border-b border-line py-4">
                      <Reveal distance={10} delay={i * 0.05}>
                        <p className="text-[1.05rem] text-fg">{it.title}</p>
                        {it.note && <p className="mt-1 text-[0.9rem] text-muted">{it.note}</p>}
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 05 — writing */}
      <section aria-labelledby="yazilar-title" className="shell py-20 md:py-28">
        <SectionHeading index="05" title="Son yazılar" path="~/blog" id="yazilar-title" action={{ href: '/blog', label: 'Tüm yazılar' }} />
        {posts.docs.length ? <PostList posts={posts.docs} /> : <EmptyNote>İlk yazı hazırlanıyor.</EmptyNote>}
      </section>

      <ContactSection profile={profile} formEnabled={settings.contactFormEnabled !== false} />
    </>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="text-fg-soft">{children}</p>
      <p className="meta mt-2">
        <Link href="/" className="link-quiet">
          ~/
        </Link>{' '}
        boş dizin
      </p>
    </div>
  )
}
