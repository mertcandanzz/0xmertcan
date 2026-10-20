/** Tiny builders for Lexical editor state, used by the seed script. */

type N = Record<string, unknown>

const base = { format: '' as const, indent: 0, version: 1, direction: 'ltr' as const }

export const text = (t: string, format = 0): N => ({ type: 'text', text: t, format, detail: 0, mode: 'normal', style: '', version: 1 })
export const bold = (t: string) => text(t, 1)
export const code = (t: string) => text(t, 16)

type Inline = string | N
const inline = (parts: Inline[]) => parts.map((p) => (typeof p === 'string' ? text(p) : p))

export const p = (...parts: Inline[]): N => ({ ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: inline(parts) })
export const h = (tag: 'h2' | 'h3', t: string): N => ({ ...base, type: 'heading', tag, children: [text(t)] })
export const quote = (...parts: Inline[]): N => ({ ...base, type: 'quote', children: inline(parts) })
export const link = (url: string, label: string): N => ({
  ...base,
  type: 'link',
  version: 3,
  fields: { linkType: 'custom', url, newTab: true },
  children: [text(label)],
})
export const ul = (...items: Inline[][]): N => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((parts, i) => ({ ...base, type: 'listitem', value: i + 1, children: inline(parts) })),
})
export const ol = (...items: Inline[][]): N => ({
  ...base,
  type: 'list',
  listType: 'number',
  start: 1,
  tag: 'ol',
  children: items.map((parts, i) => ({ ...base, type: 'listitem', value: i + 1, children: inline(parts) })),
})
let blockId = 0
export const codeBlock = (language: string, source: string): N => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: `${(blockId++).toString(16).padStart(24, '0')}`, blockName: '', blockType: 'Code', language, code: source },
})

export const doc = (...children: N[]) => ({ root: { ...base, type: 'root', children } }) as never
