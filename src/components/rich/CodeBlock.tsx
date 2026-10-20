import { CODE_LANGUAGES } from '@/payload/editor'

import { CopyButton } from './CopyButton'
import { highlight } from './highlight'

export async function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  const lang = language || 'plaintext'
  const html = await highlight(code, lang)
  const label = CODE_LANGUAGES[lang as keyof typeof CODE_LANGUAGES] ?? lang
  return (
    <figure className="code-block not-prose my-8 overflow-hidden rounded-[3px] border border-line bg-[#141416] md:-mx-6">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="meta">{label}</span>
        <CopyButton text={code} />
      </figcaption>
      {/* Shiki escapes the source; the HTML contains only its own spans. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  )
}
