'use client'

import { useEffect, useRef, useState } from 'react'

import type { TocItem } from '@/lib/lexical'

/** 2px reading progress under the header, driven by the article's own scroll extent. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = document.getElementById(targetId)
    const bar = ref.current
    if (!el || !bar) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.6
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1
      bar.style.setProperty('--read', p.toFixed(4))
      bar.setAttribute('aria-valuenow', String(Math.round(p * 100)))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [targetId])
  return (
    <div className="fixed inset-x-0 top-[var(--header-h)] z-40 h-[2px]" role="progressbar" aria-label="Okuma ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <div ref={ref} className="reading-progress h-full bg-accent" />
    </div>
  )
}

/** Table of contents with the current section highlighted. */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null)

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  return (
    <nav aria-label="İçindekiler">
      <p className="meta mb-4">içindekiler</p>
      <ol className="border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              className={`-ml-px block border-l py-1.5 text-[0.86rem] leading-snug transition-colors ${item.level === 3 ? 'pl-7' : 'pl-4'} ${
                active === item.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg-soft'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
