import Link from 'next/link'

import { Dolly } from '@/components/cinema/Cinema'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import { Reveal } from '@/components/ui/motion'
import type { Project } from '@/lib/data'
import { PROJECT_STATUS } from '@/lib/site'

import { ProjectPreview } from './ProjectPreview'

const pad = (n: number) => String(n + 1).padStart(2, '0')

export function ProjectMeta({ project, className = '' }: { project: Project; className?: string }) {
  return (
    <p className={`meta flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-fg-soft">
        <span className={`size-1.5 rounded-full ${project.status === 'archived' ? 'bg-faint' : 'bg-accent'}`} aria-hidden="true" />
        {PROJECT_STATUS[project.status] ?? project.status}
      </span>
      {project.year && <span>{project.year}</span>}
      {project.kind && <span>{project.kind}</span>}
      {project.isExample && <span className="badge-example">örnek</span>}
    </p>
  )
}

export function StackList({ project, max = 6 }: { project: Project; max?: number }) {
  const stack = (project.stack ?? []).slice(0, max)
  if (!stack.length) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Teknolojiler">
      {stack.map((s) => (
        <li key={s.id ?? s.name} className="font-mono text-[0.7rem] text-muted before:mr-1.5 before:text-faint before:content-['/'] first:before:content-none">
          {s.name}
        </li>
      ))}
    </ul>
  )
}

/** Lead project: wide, cursor-lit surface (SpotlightCard) with the preview and story hook. */
export function FeaturedProject({ project, index }: { project: Project; index: number }) {
  return (
    <Dolly>
      <SpotlightCard
        className="group rounded-[2px] border border-line"
        style={{ '--spotlight-card-surface': '#161618', '--spotlight-card-border': '#242428', '--spotlight-card-shadow': 'none' } as React.CSSProperties}
        spotlightColor="#e53935"
        intensity={0.16}
        borderGlow={0.9}
        spotlightSize={380}
        proximity={60}
      >
        <Link href={`/projeler/${project.slug}`} className="grid outline-offset-[-2px] md:grid-cols-12">
          <div className="border-b border-line md:col-span-7 md:border-b-0 md:border-r">
            <ProjectPreview project={project} index={index} priority parallax />
          </div>
          <div className="flex flex-col p-6 md:col-span-5 md:p-10">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[0.8rem] text-accent-text">{pad(index)}</span>
              <ProjectMeta project={project} />
            </div>
            <h3 className="mt-10 text-[clamp(1.8rem,3.2vw,2.75rem)] font-medium leading-[1.02] tracking-[-0.03em] text-fg md:mt-auto">{project.title}</h3>
            <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-muted">{project.summary}</p>
            <div className="mt-8 flex items-end justify-between gap-6">
              <StackList project={project} />
              <span className="flex shrink-0 items-center gap-2 text-[0.9rem] text-fg">
                İncele
                <span aria-hidden="true" className="font-mono transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>
      </SpotlightCard>
    </Dolly>
  )
}

/**
 * Remaining projects as an index: numbered rows with a sliding preview that
 * follows the row on pointer devices. On touch the rows are plain links.
 */
export function ProjectRows({ projects, offset = 0 }: { projects: Project[]; offset?: number }) {
  return (
    <ol className="border-t border-line">
      {projects.map((p, i) => (
        <li key={p.id}>
          <Reveal distance={16} delay={i * 0.05}>
            <Link href={`/projeler/${p.slug}`} className="group relative grid grid-cols-12 items-center gap-4 border-b border-line py-6 outline-offset-[-2px] md:py-8">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0 bg-[linear-gradient(90deg,rgba(229,57,53,0.07),transparent)] transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-full" />
              <span className="col-span-2 font-mono text-[0.8rem] text-faint transition-colors group-hover:text-accent-text md:col-span-1">{pad(offset + i)}</span>
              <span className="col-span-10 md:col-span-5">
                <span className="block text-[1.35rem] font-medium tracking-[-0.02em] text-fg transition-transform duration-500 ease-[var(--ease-out-expo)] md:text-[1.75rem] md:group-hover:translate-x-2">
                  {p.title}
                </span>
                <span className="mt-1 block text-[0.95rem] text-muted md:hidden">{p.summary}</span>
              </span>
              <span className="col-span-4 hidden text-[0.92rem] leading-snug text-muted md:block">{p.summary}</span>
              <span className="col-span-10 col-start-3 flex items-center justify-between md:col-span-2 md:col-start-auto md:justify-end md:gap-4">
                <ProjectMeta project={p} className="md:hidden" />
                <span className="meta hidden md:inline">{p.year ?? ''}</span>
                <span aria-hidden="true" className="font-mono text-fg-soft transition-transform duration-300 group-hover:translate-x-1 group-hover:text-fg">
                  →
                </span>
              </span>
              <span className="pointer-events-none absolute right-[18%] top-1/2 z-10 hidden w-[18rem] -translate-y-1/2 rotate-[-2deg] scale-95 border border-line-strong opacity-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[var(--ease-out-expo)] [@media(hover:hover)]:block group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100 lg:right-[24%]">
                <ProjectPreview project={p} index={offset + i} sizes="18rem" />
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}
