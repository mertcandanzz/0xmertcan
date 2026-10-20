import { slugify } from './slugify'

type Node = { type?: string; text?: string; tag?: string; children?: Node[]; fields?: Record<string, unknown> }
export type LexicalDoc = { root?: Node } | null | undefined

/** Flattens a Lexical document into plain text (used for search + reading time). */
export function lexicalToText(doc: LexicalDoc): string {
  const out: string[] = []
  const walk = (node?: Node) => {
    if (!node) return
    if (typeof node.text === 'string') out.push(node.text)
    if (node.type === 'block' && typeof node.fields?.code === 'string') out.push(node.fields.code as string)
    node.children?.forEach(walk)
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem') out.push('\n')
  }
  walk(doc?.root)
  return out.join(' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
}

/** ~220 words per minute for Turkish prose; code is read slower and counted at half speed. */
export function readingMinutes(doc: LexicalDoc): number {
  let prose = 0
  let code = 0
  const count = (s: string) => s.split(/\s+/).filter(Boolean).length
  const walk = (node?: Node) => {
    if (!node) return
    if (typeof node.text === 'string') prose += count(node.text)
    if (node.type === 'block' && typeof node.fields?.code === 'string') code += count(node.fields.code as string)
    node.children?.forEach(walk)
  }
  walk(doc?.root)
  return Math.max(1, Math.round(prose / 220 + code / 110))
}

export type TocItem = { id: string; text: string; level: 2 | 3 }

export function headingText(node: Node): string {
  return (node.children ?? []).map((c) => c.text ?? headingText(c)).join('')
}

/** Produces stable, unique heading ids. The same function is used by the renderer. */
export function createHeadingIdFactory() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text) || 'bolum'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n ? `${base}-${n + 1}` : base
  }
}

export function extractToc(doc: LexicalDoc): TocItem[] {
  const nextId = createHeadingIdFactory()
  const items: TocItem[] = []
  for (const node of doc?.root?.children ?? []) {
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      const text = headingText(node)
      items.push({ id: nextId(text), text, level: node.tag === 'h2' ? 2 : 3 })
    }
  }
  return items
}
