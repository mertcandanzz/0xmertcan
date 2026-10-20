import Link from 'next/link'
import type { ReactNode } from 'react'

import { RuleDraw } from '@/components/cinema/Cinema'

import { Decode } from './motion'

type Props = {
  index: string
  title: string
  path: string
  id?: string
  action?: { href: string; label: string }
  children?: ReactNode
  as?: 'h1' | 'h2'
}

/** `01 ─────── ~/projeler` header used by every editorial section. */
export function SectionHeading({ index, title, path, id, action, children, as: Tag = 'h2' }: Props) {
  return (
    <header className="mb-12 md:mb-16">
      <div className="flex items-center gap-4">
        <span className="meta text-accent-text">{index}</span>
        <RuleDraw className="flex-1" />
        <span className="meta">{path}</span>
      </div>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Tag id={id} className="text-[clamp(2.1rem,5.4vw,4.25rem)] font-medium leading-[0.98] tracking-[-0.035em] text-fg">
          <Decode text={title} />
        </Tag>
        {action && (
          <Link href={action.href} className="group inline-flex items-center gap-2 self-start text-[0.92rem] text-fg-soft hover:text-fg md:self-auto">
            <span className="link-draw">{action.label}</span>
            <span aria-hidden="true" className="font-mono transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        )}
      </div>
      {children && <div className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">{children}</div>}
    </header>
  )
}
