'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

/** Search box that keeps the query in the URL (shareable, server-rendered results). */
export function BlogSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value.trim()) next.set('q', value.trim())
      else next.delete('q')
      next.delete('sayfa')
      const qs = next.toString()
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
    }, 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
      <label htmlFor="blog-q" className="sr-only">
        Yazılarda ara
      </label>
      <span aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-mono text-accent-text">
        ❯
      </span>
      <input
        ref={inputRef}
        id="blog-q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="başlık, içerik ya da kod içinde ara"
        className="field pl-6 pr-16 font-mono text-[0.95rem]"
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
      />
      <span className="meta pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">{pending ? 'aranıyor…' : <kbd>/</kbd>}</span>
    </form>
  )
}
