'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { NAV } from '@/lib/site'

import { useFocusTrap } from './useFocusTrap'

const subscribeNoop = () => () => {}

export function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)
  const [lastPath, setLastPath] = useState(pathname)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Close on navigation (state adjusted during render, not in an effect).
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const button = buttonRef.current
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      button?.focus()
    }
  }, [open])

  useFocusTrap(panelRef, open)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[70] grid size-10 place-items-center rounded-full text-fg"
      >
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span className={`absolute left-0 block h-px w-5 bg-current transition-transform duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
          <span className={`absolute left-0 block h-px bg-current transition-all duration-300 ${open ? 'top-1.5 w-5 -rotate-45' : 'top-3 w-3'}`} />
        </span>
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menü"
                className="fixed inset-0 z-40 flex flex-col bg-bg px-[var(--gutter)] pb-8 pt-[calc(var(--header-h)+2rem)] md:hidden"
                initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="meta mb-6">~/menu</p>
                <ul className="flex flex-col border-t border-line">
                  <li>
                    <MenuLink href="/" index={0} label="Ana sayfa" active={pathname === '/'} reduce={!!reduce} />
                  </li>
                  {NAV.map((item, i) => (
                    <li key={item.href}>
                      <MenuLink
                        href={item.href}
                        index={i + 1}
                        label={item.label}
                        active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                        reduce={!!reduce}
                      />
                    </li>
                  ))}
                </ul>
                <p className="meta mt-auto">
                  Kısayol: <kbd className="text-fg-soft">Ctrl K</kbd> ile her yere ulaşın.
                </p>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

function MenuLink({ href, index, label, active, reduce }: { href: string; index: number; label: string; active: boolean; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className="flex items-baseline justify-between border-b border-line py-4 text-[2rem] font-medium tracking-tight text-fg aria-[current=page]:text-accent-text"
      >
        {label}
        <span className="meta">{String(index).padStart(2, '0')}</span>
      </Link>
    </motion.div>
  )
}
