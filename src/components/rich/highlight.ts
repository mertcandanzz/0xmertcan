import 'server-only'

import { createHighlighter, type Highlighter, type ThemeRegistration } from 'shiki'

/** Charcoal theme: warm off-white text, a single red for keywords, greys for structure. */
const theme: ThemeRegistration = {
  name: 'oxm',
  type: 'dark',
  colors: { 'editor.background': '#141416', 'editor.foreground': '#d9d7d1' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6c6c72', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new'], settings: { foreground: '#f05a54' } },
    { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: '#c8c2a8' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#e9a79f' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#f1efea' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class'], settings: { foreground: '#b8b6c4' } },
    { scope: ['variable.parameter'], settings: { foreground: '#d9d7d1', fontStyle: 'italic' } },
    { scope: ['entity.name.tag', 'meta.tag'], settings: { foreground: '#f05a54' } },
    { scope: ['entity.other.attribute-name', 'support.type.property-name', 'meta.object-literal.key'], settings: { foreground: '#a9a9ac' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: '#8a8a90' } },
    { scope: ['markup.inserted'], settings: { foreground: '#8fbf8f' } },
    { scope: ['markup.deleted'], settings: { foreground: '#f05a54' } },
  ],
}

export const LANGS = ['ts', 'tsx', 'js', 'jsx', 'bash', 'json', 'css', 'html', 'sql', 'python', 'go', 'rust', 'yaml', 'diff'] as const

let instance: Promise<Highlighter> | null = null
const highlighter = () => (instance ??= createHighlighter({ themes: [theme], langs: [...LANGS] }))

export async function highlight(code: string, lang: string) {
  const h = await highlighter()
  const language = (LANGS as readonly string[]).includes(lang) ? lang : 'text'
  return h.codeToHtml(code, { lang: language, theme: 'oxm' })
}
