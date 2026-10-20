'use client'

import { useEffect, useState } from 'react'

import { WORDMARK_RATIO, Wordmark } from '@/brand/Wordmark'
import { HeroExit } from '@/components/cinema/Cinema'
import TextType from '@/components/reactbits/TextType'

import { HeroField, type HeroBackground } from './HeroField'

type Props = { name: string; role: string; location?: string | null; availability?: string | null; background: HeroBackground }

const COMMAND = 'whoami'

/**
 * Hero composition over the ShapeWaves field. The giant signature itself is
 * NOT rendered here — the header's single brand mark is positioned over
 * `[data-sig-anchor]`, and the field leaves a carved gap around that box.
 * The static copy is only shown for reduced motion.
 */
export function Hero({ name, role, location, availability, background }: Props) {
  const [intro, setIntro] = useState(false)
  const [cursor, setCursor] = useState(true)
  const [clock, setClock] = useState<string | null>(null)

  useEffect(() => {
    const playing = document.documentElement.hasAttribute('data-intro')
    // Reads the pre-paint intro flag and the local clock — browser-only state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntro(playing)
    // Hand the caret over to the signature once the command is "entered".
    const t = setTimeout(() => setCursor(false), playing ? 480 : 0)
    const fmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
    setClock(fmt.format(new Date()))
    return () => clearTimeout(t)
  }, [])

  return (
    <section data-hero aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col pb-8 pt-[calc(var(--header-h)+1.5rem)] md:pb-10">
      <HeroField variant={background} />

      <div className="shell flex flex-1 flex-col">
        <div className="hero-fade">
          <div className="flex items-start justify-between gap-6" data-hero-reveal style={{ transitionDelay: '1.05s' }}>
            <p className="meta">
              <span className="text-fg-soft">oturum</span> tty/0xm
              <span className="mx-2 text-faint">·</span>
              <span suppressHydrationWarning>{clock ?? '--:--'}</span> TRT
            </p>
            <p className="meta hidden sm:block">~/index.tsx</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-12">
          <p className="hero-fade mb-4 inline-flex items-center self-start border border-line bg-bg px-3 py-1.5 font-mono text-[0.78rem] text-muted md:mb-6 md:text-[0.88rem]">
            <span className="text-accent-text">mertcan@0xm</span>
            <span className="text-faint">:</span>
            <span className="text-fg-soft">~</span>
            <span className="whitespace-pre text-faint">$ </span>
            {intro ? (
              <TextType as="span" text={COMMAND} typingSpeed={62} loop={false} showCursor={cursor} cursorStyle="block" cursorBlinkDuration={0} className="text-fg" />
            ) : (
              <span className="text-fg">{COMMAND}</span>
            )}
          </p>

          <h1 id="hero-title" className="sr-only">
            {name} — {role}. 0xmertcan.
          </h1>

          {/* The header's brand mark lands exactly on this box. */}
          <div data-sig-anchor aria-hidden="true" className="relative w-full" style={{ aspectRatio: WORDMARK_RATIO }}>
            <Wordmark className="hero-static-sig absolute inset-0 hidden h-full w-full" title="" />
          </div>
        </div>

        <HeroExit>
        <div className="grid gap-6 border-t border-line pt-5 md:grid-cols-12 md:items-end" data-hero-reveal style={{ transitionDelay: '0.95s' }}>
          <div className="md:col-span-6">
            <p className="text-[1.35rem] font-medium tracking-tight text-fg md:text-[1.6rem]">{name}</p>
            <p className="mt-1 text-[1rem] text-muted md:text-[1.1rem]">{role}</p>
          </div>
          <dl className="meta grid grid-cols-2 gap-x-6 gap-y-1 md:col-span-4">
            {location && (
              <>
                <dt className="text-faint">konum</dt>
                <dd className="text-fg-soft">{location}</dd>
              </>
            )}
            {availability && (
              <>
                <dt className="text-faint">durum</dt>
                <dd className="text-fg-soft">
                  <span className="mr-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-accent" aria-hidden="true" />
                  {availability}
                </dd>
              </>
            )}
          </dl>
          <a href="#giris" className="group meta flex items-center gap-3 justify-self-start text-fg-soft hover:text-fg md:col-span-2 md:justify-self-end">
            kaydır
            <span aria-hidden="true" className="relative block h-8 w-px overflow-hidden bg-line-strong">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-accent transition-transform duration-500 group-hover:translate-y-full" />
            </span>
          </a>
        </div>
        </HeroExit>
      </div>
    </section>
  )
}
