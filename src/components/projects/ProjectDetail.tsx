import Image from 'next/image'
import Link from 'next/link'

import { RichText } from '@/components/rich/RichText'
import { MagneticLink } from '@/components/ui/motion'
import { media, type Project } from '@/lib/data'
import { PROJECT_STATUS } from '@/lib/site'

import { StackList } from './ProjectIndex'
import { ProjectPreview } from './ProjectPreview'

const STORY = [
  ['problem', 'Problem'],
  ['approach', 'Yaklaşım'],
  ['decisions', 'Teknik kararlar'],
  ['outcome', 'Sonuç'],
  ['learnings', 'Öğrenilenler'],
] as const

const hasContent = (v: unknown) => Boolean(v && typeof v === 'object' && (v as { root?: { children?: unknown[] } }).root?.children?.length)

export function ProjectDetail({ project, next }: { project: Project; next?: Project | null }) {
  const story = STORY.filter(([key]) => hasContent(project[key]))
  const gallery = (project.gallery ?? []).map((g) => media(g.image)).filter(Boolean)
  return (
    <article className="pb-10 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <header className="shell">
        <nav aria-label="İçerik yolu" className="meta mb-10 flex items-center gap-2">
          <Link href="/projeler" className="link-quiet">
            ~/projeler
          </Link>
          <span className="text-faint">/</span>
          <span className="text-fg-soft">{project.slug}</span>
        </nav>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            {project.isExample && <p className="badge-example mb-6">örnek içerik</p>}
            <h1 className="text-[clamp(2.4rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-fg">{project.title}</h1>
            <p className="mt-6 max-w-2xl text-[1.15rem] leading-relaxed text-fg-soft md:text-[1.3rem]">{project.summary}</p>
          </div>
          <dl className="grid grid-cols-2 content-end gap-x-6 gap-y-4 self-end md:col-span-4 md:grid-cols-1">
            {(
              [
                ['durum', PROJECT_STATUS[project.status] ?? project.status],
                ['yıl', project.year ? String(project.year) : null],
                ['tür', project.kind],
                ['rol', project.role],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="border-t border-line pt-3">
                  <dt className="meta">{k}</dt>
                  <dd className="mt-1 text-[0.98rem] text-fg">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
        {(project.repoUrl || project.liveUrl) && (
          <div className="mt-10 flex flex-wrap gap-3">
            {project.liveUrl && (
              <MagneticLink href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Canlı demo <span aria-hidden="true">↗</span>
                <span className="sr-only">(yeni sekmede açılır)</span>
              </MagneticLink>
            )}
            {project.repoUrl && (
              <MagneticLink href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Kaynak kod <span aria-hidden="true">↗</span>
                <span className="sr-only">(yeni sekmede açılır)</span>
              </MagneticLink>
            )}
          </div>
        )}
      </header>

      <div className="shell mt-14 md:mt-20">
        <div className="overflow-hidden border border-line">
          <ProjectPreview project={project} index={0} sizes="100vw" priority />
        </div>
        <div className="mt-4 flex items-center justify-between gap-6">
          <StackList project={project} max={12} />
        </div>
      </div>

      {story.length > 0 && (
        <div className="shell mt-20 md:mt-28">
          {story.map(([key, label], i) => (
            <section key={key} aria-labelledby={`s-${key}`} className="grid gap-6 border-t border-line py-12 md:grid-cols-12 md:py-16">
              <div className="md:col-span-4">
                <p className="meta text-accent-text">{String(i + 1).padStart(2, '0')}</p>
                <h2 id={`s-${key}`} className="mt-2 text-[1.5rem] font-medium tracking-tight text-fg">
                  {label}
                </h2>
              </div>
              <div className="md:col-span-7 md:col-start-6">
                <RichText data={project[key]} />
              </div>
            </section>
          ))}
        </div>
      )}

      {gallery.length > 0 && (
        <div className="shell mt-10 grid gap-6 md:grid-cols-2">
          {gallery.map((g) => (
            <figure key={g!.id}>
              <Image src={g!.sizes?.wide?.url || g!.url!} alt={g!.alt} width={g!.width ?? 1600} height={g!.height ?? 1000} sizes="(min-width: 768px) 50vw, 100vw" className="h-auto w-full border border-line" />
              {g!.caption && <figcaption className="meta mt-2">{g!.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {next && (
        <div className="shell mt-24">
          <Link href={`/projeler/${next.slug}`} className="group flex items-end justify-between gap-6 border-y border-line py-10">
            <span>
              <span className="meta block">sonraki proje</span>
              <span className="mt-2 block text-[clamp(1.6rem,4vw,3rem)] font-medium tracking-[-0.03em] text-fg">{next.title}</span>
            </span>
            <span aria-hidden="true" className="font-mono text-2xl text-fg-soft transition-transform duration-300 group-hover:translate-x-2">
              →
            </span>
          </Link>
        </div>
      )}
    </article>
  )
}
