'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import AnimatedContent from '@/components/reactbits/AnimatedContent'
import DecryptedText from '@/components/reactbits/DecryptedText'
import Magnet from '@/components/reactbits/Magnet'

/**
 * Motion vocabulary of the site, built on React Bits primitives:
 *  - <Reveal>        section entrances (AnimatedContent, short rise + fade, once)
 *  - <Decode>        headings resolving from glyph noise (DecryptedText, on view)
 *  - <MagneticLink>  restrained pull on primary actions (Magnet, pointer only)
 * One interaction = one implementation; nothing else animates these concerns.
 */

export function Reveal({ children, delay = 0, className, distance = 28 }: { children: ReactNode; delay?: number; className?: string; distance?: number }) {
  return (
    <AnimatedContent distance={distance} duration={0.9} ease="expo.out" initialOpacity={0} threshold={0.15} delay={delay} className={className}>
      {children}
    </AnimatedContent>
  )
}

const GLYPHS = '01<>/_x#$*{}[]'

export function Decode({ text, className }: { text: string; className?: string }) {
  return (
    <DecryptedText
      text={text}
      animateOn="view"
      sequential
      revealDirection="start"
      speed={28}
      maxIterations={8}
      characters={GLYPHS}
      className={className}
      encryptedClassName="text-faint"
    />
  )
}

type MagneticLinkProps = ComponentProps<typeof Link> & { strength?: number; wrapperClassName?: string }

export function MagneticLink({ strength = 3, wrapperClassName, ...props }: MagneticLinkProps) {
  return (
    <Magnet padding={40} magnetStrength={strength} maxOffset={10} wrapperClassName={wrapperClassName}>
      <Link {...props} />
    </Magnet>
  )
}

export function MagneticButton({ strength = 3, children, ...props }: ComponentProps<'button'> & { strength?: number }) {
  return (
    <Magnet padding={40} magnetStrength={strength} maxOffset={10}>
      <button {...props}>{children}</button>
    </Magnet>
  )
}
