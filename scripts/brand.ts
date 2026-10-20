/**
 * Writes the static logo files to /public/brand and the favicon to /src/app.
 * Run: npx tsx scripts/brand.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { CARET, GLYPHS, layout, PALETTE, STROKE, SYMBOL, VIEW_H, VIEW_Y } from '../src/brand/glyphs'

type Variant = 'dark' | 'light' | 'mono'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'public', 'brand')
mkdirSync(out, { recursive: true })

const strokeAttrs = (w = STROKE) => `fill="none" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="10"`

function colors(variant: Variant) {
  if (variant === 'mono') return { ink: 'currentColor', muted: 'currentColor', accent: 'currentColor', bg: null }
  return { ...PALETTE[variant] }
}

function wordmark(variant: Variant, { background = false } = {}) {
  const c = colors(variant)
  const { glyphs, caretX, width } = layout()
  const pad = background ? 4 : 0
  const vb = `${-pad} ${VIEW_Y - pad} ${width + pad * 2} ${VIEW_H + pad * 2}`
  const paths = glyphs
    .map((g) => `<path d="${g.d}" transform="translate(${g.x} 0)" stroke="${c[g.tone]}"/>`)
    .join('')
  const bg = background && c.bg ? `<rect x="${-pad}" y="${VIEW_Y - pad}" width="${width + pad * 2}" height="${VIEW_H + pad * 2}" fill="${c.bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="0xmertcan">${bg}<g ${strokeAttrs()}>${paths}</g><rect x="${caretX}" y="${CARET.y}" width="${CARET.w}" height="${CARET.h}" fill="${c.accent}"/></svg>\n`
}

function symbol(variant: Variant, { tile = false } = {}) {
  const c = colors(variant)
  const w = SYMBOL.caretX + STROKE
  const h = VIEW_H
  // Square tile with optical centring of the mark.
  const size = tile ? 16 : Math.max(w, h)
  const ox = (size - w) / 2
  const oy = (size - h) / 2 - VIEW_Y
  const zeroOutline = GLYPHS['0'].d.split(' M')[0]
  const zeroSlash = 'M' + GLYPHS['0'].d.split(' M')[1]
  const bg = tile && c.bg ? `<rect width="${size}" height="${size}" rx="3.2" fill="${c.bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="0xmertcan">${bg}<g transform="translate(${ox.toFixed(3)} ${oy.toFixed(3)})"><g ${strokeAttrs(tile ? 1.55 : STROKE)}><path d="${zeroOutline}" stroke="${c.ink}"/><path d="${zeroSlash}" stroke="${c.accent}"/></g><rect x="${SYMBOL.caretX}" y="${CARET.y}" width="${tile ? 1.55 : CARET.w}" height="${CARET.h}" fill="${c.accent}"/></g></svg>\n`
}

const files: Record<string, string> = {
  'wordmark-dark.svg': wordmark('dark'),
  'wordmark-light.svg': wordmark('light'),
  'wordmark-mono.svg': wordmark('mono'),
  'wordmark-dark-bg.svg': wordmark('dark', { background: true }),
  'symbol-dark.svg': symbol('dark'),
  'symbol-light.svg': symbol('light'),
  'symbol-mono.svg': symbol('mono'),
  'symbol-tile.svg': symbol('dark', { tile: true }),
}

for (const [name, svg] of Object.entries(files)) writeFileSync(path.join(out, name), svg)
writeFileSync(path.join(root, 'src', 'app', 'icon.svg'), symbol('dark', { tile: true }))
console.log(`brand: wrote ${Object.keys(files).length} files to public/brand + src/app/icon.svg`)
