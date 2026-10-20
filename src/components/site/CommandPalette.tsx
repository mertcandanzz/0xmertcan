'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { useFocusTrap } from './useFocusTrap'

export type PaletteEntry = { title: string; href: string; hint?: string | null }
type Group = { label: string; items: PaletteEntry[] }

const EVENT = 'oxm:palette'
export const openCommandPalette = () => window.dispatchEvent(new Event(EVENT))

const norm = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')

/** Every query token must appear in title or hint; title hits rank higher. */
function score(entry: PaletteEntry, tokens: string[]) {
  if (!tokens.length) return 1
  const title = norm(entry.title)
  const hint = norm(entry.hint ?? '')
  let s = 0
  for (const t of tokens) {
    if (title.startsWith(t)) s += 4
    else if (title.includes(t)) s += 3
    else if (hint.includes(t)) s += 1
    else return 0
  }
  return s
}

export function CommandPalette({ pages, projects, posts }: { pages: PaletteEntry[]; projects: PaletteEntry[]; posts: PaletteEntry[] }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const id = useId()

  useEffect(() => {
    const toggle = () => {
      setQuery('')
      setActive(0)
      setOpen((v) => {
        if (!v) returnFocus.current = document.activeElement as HTMLElement
        return !v
      })
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener(EVENT, toggle)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(EVENT, toggle)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
        returnFocus.current?.focus?.()
      }
    }
  }, [open])

  useFocusTrap(dialogRef, open, inputRef)

  const groups: Group[] = useMemo(() => {
    const tokens = norm(query).split(/\s+/).filter(Boolean)
    const pick = (items: PaletteEntry[], max: number) =>
      items
        .map((item) => ({ item, s: score(item, tokens) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, max)
        .map((x) => x.item)
    return [
      { label: 'Sayfalar', items: pick(pages, 8) },
      { label: 'Projeler', items: pick(projects, tokens.length ? 8 : 4) },
      { label: 'Yazılar', items: pick(posts, tokens.length ? 10 : 5) },
      {
        label: 'Ara',
        items: tokens.length ? [{ title: `Blogda “${query.trim()}” ara`, href: `/blog?q=${encodeURIComponent(query.trim())}`, hint: 'Tam metin arama' }] : [],
      },
    ].filter((g) => g.items.length)
  }, [query, pages, projects, posts])

  const flat = groups.flatMap((g) => g.items)
  const current = Math.min(active, Math.max(0, flat.length - 1))

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [current])

  const go = (entry?: PaletteEntry) => {
    if (!entry) return
    setOpen(false)
    returnFocus.current = null
    router.push(entry.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((current + 1) % Math.max(1, flat.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((current - 1 + flat.length) % Math.max(1, flat.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(flat[current])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  let n = -1
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-[#0b0b0c]/75 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Komut paleti"
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]"
            initial={reduce ? false : { y: -8, scale: 0.985 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduce ? undefined : { y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <span className="font-mono text-sm text-accent-text" aria-hidden="true">
                ❯
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                placeholder="Sayfa, proje ya da yazı ara…"
                className="h-14 w-full bg-transparent text-[0.98rem] text-fg placeholder:text-faint focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={flat.length ? `${id}-opt-${current}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="meta shrink-0 rounded border border-line px-1.5 py-0.5">esc</kbd>
            </div>
            <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label="Sonuçlar" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
              {groups.map((g) => (
                <li key={g.label} role="presentation">
                  <p className="meta px-3 pb-1.5 pt-3" role="presentation">
                    {g.label}
                  </p>
                  <ul role="group" aria-label={g.label}>
                    {g.items.map((item) => {
                      n += 1
                      const i = n
                      const selected = i === current
                      return (
                        <li
                          key={item.href}
                          id={`${id}-opt-${i}`}
                          role="option"
                          aria-selected={selected}
                          onMouseMove={() => active !== i && setActive(i)}
                          onClick={() => go(item)}
                          className="group flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 aria-selected:bg-raised"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[0.92rem] text-fg">{item.title}</span>
                            {item.hint && <span className="block truncate text-[0.8rem] text-muted">{item.hint}</span>}
                          </span>
                          <span className="meta shrink-0 opacity-0 group-aria-selected:opacity-100">↵</span>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
              {!groups.some((g) => g.label !== 'Ara') && query.trim() && (
                <li className="px-3 py-10 text-center" role="presentation">
                  <p className="text-fg">“{query}” için sonuç yok.</p>
                  <p className="meta mt-2">Başka bir kelime deneyin ya da blogda arayın.</p>
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
              <span className="meta">↑↓ gez · ↵ aç</span>
              <span className="meta">0xmertcan</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
