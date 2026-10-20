import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import { media } from '@/lib/data'
import { createHeadingIdFactory, headingText } from '@/lib/lexical'

import { CodeBlock } from './CodeBlock'

const SAFE_HREF = /^(https?:|mailto:|\/(?!\/)|#)/i

function safeHref(url?: string | null) {
  const value = (url ?? '').trim()
  return SAFE_HREF.test(value) ? value : undefined
}

function internalHref(doc: unknown, relationTo?: string) {
  const slug = doc && typeof doc === 'object' && 'slug' in doc ? (doc as { slug: string }).slug : null
  if (!slug) return undefined
  return relationTo === 'projects' ? `/projeler/${slug}` : `/blog/${slug}`
}

type Props = { data?: unknown; className?: string; anchors?: boolean }

export function RichText({ data, className = 'prose-oxm', anchors = false }: Props) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  const nextId = createHeadingIdFactory()

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const Tag = (['h2', 'h3', 'h4'].includes(node.tag) ? node.tag : 'h2') as 'h2' | 'h3' | 'h4'
      const children = nodesToJSX({ nodes: node.children })
      if (Tag === 'h4') return <h4>{children}</h4>
      const id = nextId(headingText(node as never))
      return (
        <Tag id={id}>
          {children}
          {anchors && (
            <a href={`#${id}`} className="anchor" aria-label="Bu bölümün bağlantısı">
              #
            </a>
          )}
        </Tag>
      )
    },
    link: ({ node, nodesToJSX }) => {
      const f = node.fields as { linkType?: string; url?: string; newTab?: boolean; doc?: { value?: unknown; relationTo?: string } }
      const href = f.linkType === 'internal' ? internalHref(f.doc?.value, f.doc?.relationTo) : safeHref(f.url)
      const children = nodesToJSX({ nodes: node.children })
      if (!href) return <span>{children}</span>
      const external = /^https?:/i.test(href)
      return (
        <a href={href} {...(f.newTab || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      )
    },
    autolink: ({ node, nodesToJSX }) => {
      const href = safeHref((node.fields as { url?: string }).url)
      const children = nodesToJSX({ nodes: node.children })
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <span>{children}</span>
      )
    },
    upload: ({ node }) => {
      const doc = media(node.value) as unknown as { url?: string; alt?: string; width?: number; height?: number; mimeType?: string; caption?: string; sizes?: { wide?: { url?: string; width?: number; height?: number } } }
      if (!doc || typeof doc !== 'object' || !doc.url || !doc.mimeType?.startsWith('image')) return null
      const caption = (node.fields as { caption?: string } | undefined)?.caption || doc.caption
      const src = doc.sizes?.wide?.url || doc.url
      const w = doc.sizes?.wide?.width || doc.width || 1600
      const h = doc.sizes?.wide?.height || doc.height || 1000
      return (
        <figure className="my-10 md:-mx-6">
          <Image src={src} alt={doc.alt ?? ''} width={w} height={h} sizes="(min-width: 768px) 46rem, 100vw" className="h-auto w-full rounded-[2px] border border-line" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    },
    blocks: {
      Code: ({ node }: { node: { fields: unknown } }) => {
        const f = node.fields as { code?: string; language?: string }
        return f.code ? <CodeBlock code={f.code} language={f.language} /> : null
      },
    },
  })

  return <LexicalRichText data={data as SerializedEditorState} converters={converters} className={className} disableIndent disableTextAlign />
}
