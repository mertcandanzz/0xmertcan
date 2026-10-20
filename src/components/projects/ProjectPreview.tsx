import Image from 'next/image'

import { ParallaxLayer } from '@/components/cinema/Cinema'
import { media, type Project } from '@/lib/data'

/**
 * Project visual. Uses the uploaded cover when there is one; otherwise draws a
 * preview from the project's own data (command, stack, title) so every project
 * has a presentation that belongs to it rather than a stock placeholder.
 */
export function ProjectPreview({
  project,
  index,
  sizes = '(min-width: 768px) 60vw, 100vw',
  priority = false,
  parallax = false,
}: {
  project: Project
  index: number
  sizes?: string
  priority?: boolean
  parallax?: boolean
}) {
  const cover = media(project.coverImage)
  if (cover?.url) {
    const src = cover.sizes?.wide?.url || cover.url
    const image = <Image src={src} alt={cover.alt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]" />
    return <div className="relative aspect-[16/10] w-full overflow-hidden bg-raised">{parallax ? <ParallaxLayer>{image}</ParallaxLayer> : image}</div>
  }
  const style = project.previewStyle ?? 'terminal'
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#151517]" aria-hidden="true">
      {parallax ? (
        <ParallaxLayer amount={10}>
          <GridLines />
        </ParallaxLayer>
      ) : (
        <GridLines />
      )}
      {style === 'diagram' ? <Diagram project={project} /> : style === 'type' ? <TypePreview project={project} index={index} /> : <Terminal project={project} />}
    </div>
  )
}

function GridLines() {
  return (
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage: 'linear-gradient(#242428 1px, transparent 1px), linear-gradient(90deg, #242428 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
  )
}

function Terminal({ project }: { project: Project }) {
  const stack = (project.stack ?? []).map((s) => s.name).slice(0, 4)
  const cmd = project.previewCommand || `oxm run ${project.slug}`
  return (
    <div className="absolute inset-[7%] flex flex-col border border-line-strong bg-bg/90 font-mono text-[clamp(0.6rem,1.15vw,0.82rem)] leading-[1.9] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-faint">
        <span>~/projeler/{project.slug}</span>
        <span>zsh</span>
      </div>
      <div className="flex-1 px-3 py-2 text-fg-soft">
        <p>
          <span className="text-accent-text">❯</span> {cmd}
        </p>
        {stack.map((s, i) => (
          <p key={s} className="text-muted">
            <span className="text-faint">[{String(i + 1).padStart(2, '0')}]</span> {s.toLowerCase()} <span className="text-faint">··· ok</span>
          </p>
        ))}
        <p className="text-fg">
          {project.title.toLowerCase()} <span className="text-faint">hazır</span>
          <span className="caret ml-1 inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-accent" />
        </p>
      </div>
    </div>
  )
}

function Diagram({ project }: { project: Project }) {
  const nodes = (project.stack ?? []).map((s) => s.name).slice(0, 5)
  const items = nodes.length ? nodes : ['input', 'core', 'output']
  const W = 640
  const H = 400
  const cx = W / 2
  const coreY = H / 2
  const spread = items.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.015]">
      <g fontFamily="var(--font-mono)" fontSize="12">
        {items.map((label, i) => {
          const x = 70 + (i * (W - 140)) / Math.max(1, spread - 1)
          const top = i % 2 === 0
          const y = top ? 70 : H - 70
          return (
            <g key={label}>
              <path d={`M${x} ${y + (top ? 16 : -16)} V${coreY + (top ? -40 : 40)} H${cx}`} fill="none" stroke="#34343a" strokeWidth="1" />
              <rect x={x - 54} y={y - 16} width="108" height="32" fill="#111113" stroke="#34343a" />
              <text x={x} y={y + 4} textAnchor="middle" fill="#949498">
                {label.length > 13 ? `${label.slice(0, 12)}…` : label}
              </text>
            </g>
          )
        })}
        <rect x={cx - 92} y={coreY - 40} width="184" height="80" fill="#19191c" stroke="#e53935" />
        <text x={cx} y={coreY - 6} textAnchor="middle" fill="#f1efea" fontSize="15">
          {project.title.length > 20 ? `${project.title.slice(0, 19)}…` : project.title}
        </text>
        <text x={cx} y={coreY + 16} textAnchor="middle" fill="#6c6c72" fontSize="11">
          {project.kind || 'sistem'}
        </text>
      </g>
    </svg>
  )
}

function TypePreview({ project, index }: { project: Project; index: number }) {
  const initials = project.title
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toLocaleUpperCase('tr')
  return (
    <div className="absolute inset-0 flex items-end justify-between p-[6%]">
      <span className="font-mono text-[clamp(4rem,14vw,11rem)] font-medium leading-[0.8] tracking-[-0.06em] text-fg transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
        {initials}
        <span className="text-accent">.</span>
      </span>
      <span className="meta self-start">{String(index + 1).padStart(3, '0')}</span>
    </div>
  )
}
