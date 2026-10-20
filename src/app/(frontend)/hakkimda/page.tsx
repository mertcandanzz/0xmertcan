import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { RichText } from '@/components/rich/RichText'
import { Reveal } from '@/components/ui/motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getProfile, media } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Hakkımda',
  description: 'Kim, nasıl çalışır, neyle ilgilenir.',
  alternates: { canonical: '/hakkimda' },
}

type Entry = { id?: string | null; title: string; org: string; start?: string | null; end?: string | null; url?: string | null; summary?: string | null }

function Timeline({ title, path, entries }: { title: string; path: string; entries: Entry[] }) {
  return (
    <section aria-label={title} className="grid gap-6 border-t border-line py-12 md:grid-cols-12">
      <div className="md:col-span-3">
        <h2 className="text-[1.3rem] font-medium tracking-tight text-fg">{title}</h2>
        <p className="meta mt-1">{path}</p>
      </div>
      <ol className="md:col-span-8 md:col-start-5">
        {entries.map((e, i) => (
          <li key={e.id ?? i} className="grid gap-1 border-b border-line py-5 first:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <p className="meta pt-1">
              {[e.start, e.end].filter(Boolean).join(' — ')}
            </p>
            <div>
              <p className="text-[1.05rem] text-fg">{e.title}</p>
              <p className="text-[0.95rem] text-muted">
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="link-quiet">
                    {e.org}
                  </a>
                ) : (
                  e.org
                )}
              </p>
              {e.summary && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{e.summary}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default async function AboutPage() {
  const profile = await getProfile()
  const portrait = media(profile.portrait)
  const principles = profile.principles ?? []
  const experience = (profile.experience ?? []) as Entry[]
  const education = (profile.education ?? []) as Entry[]

  return (
    <div className="shell pb-10 pt-[calc(var(--header-h)+4rem)] md:pt-[calc(var(--header-h)+6rem)]">
      <SectionHeading index="03" title="Hakkımda" path="~/hakkimda" as="h1" />

      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="text-[clamp(1.4rem,2.6vw,2.1rem)] leading-[1.3] tracking-[-0.02em] text-fg">{profile.intro}</p>
          {profile.bio && (
            <div className="mt-10">
              <RichText data={profile.bio} />
            </div>
          )}
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          {portrait?.url && (
            <Image
              src={portrait.sizes?.card?.url || portrait.url}
              alt={portrait.alt}
              width={portrait.sizes?.card?.width || 960}
              height={portrait.sizes?.card?.height || 600}
              className="mb-8 h-auto w-full border border-line grayscale"
              sizes="(min-width: 768px) 30vw, 100vw"
            />
          )}
          <dl className="grid gap-4">
            {(
              [
                ['ad', profile.name],
                ['tanım', profile.role],
                ['konum', profile.location],
                ['durum', profile.availability],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt className="meta">{k}</dt>
                  <dd className="mt-1 text-fg">{v}</dd>
                </div>
              ))}
          </dl>
          <Link href="/iletisim" className="btn btn-ghost mt-8">
            İletişime geç <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>

      {principles.length > 0 && (
        <section aria-labelledby="ilkeler" className="mt-24">
          <h2 id="ilkeler" className="mb-8 text-[1.6rem] font-medium tracking-tight text-fg">
            Çalışma yaklaşımı
          </h2>
          <ol className="grid gap-px border border-line bg-line md:grid-cols-3">
            {principles.map((p, i) => (
              <li key={p.id ?? i} className="bg-bg p-6 md:p-8">
                <Reveal distance={12} delay={i * 0.06}>
                  <p className="meta text-accent-text">{'// '}{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="mt-6 text-[1.15rem] font-medium text-fg">{p.title}</h3>
                  <p className="mt-2 text-[0.96rem] leading-relaxed text-muted">{p.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(experience.length > 0 || education.length > 0) && (
        <div className="mt-24">
          {experience.length > 0 && <Timeline title="Deneyim" path="~/deneyim.log" entries={experience} />}
          {education.length > 0 && <Timeline title="Eğitim" path="~/egitim.log" entries={education} />}
        </div>
      )}
    </div>
  )
}
