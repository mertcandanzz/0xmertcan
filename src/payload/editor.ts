import {
  BlocksFeature,
  CodeBlock,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  lexicalEditor,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

export const CODE_LANGUAGES = {
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  bash: 'Bash',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  yaml: 'YAML',
  diff: 'Diff',
  plaintext: 'Düz metin',
} as const

/** Shared editor: headings, lists, quotes, links, images with captions, code blocks. */
export const richEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((f) => !['heading', 'upload', 'link', 'relationship', 'subscript', 'superscript'].includes(f.key)),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    LinkFeature({
      enabledCollections: ['posts', 'projects'],
      fields: ({ defaultFields }) => defaultFields,
    }),
    UploadFeature({
      collections: {
        media: {
          fields: [{ name: 'caption', type: 'text', label: 'Görsel açıklaması' }],
        },
      },
    }),
    HorizontalRuleFeature(),
    BlocksFeature({
      blocks: [CodeBlock({ slug: 'Code', languages: CODE_LANGUAGES, defaultLanguage: 'ts' })],
    }),
    FixedToolbarFeature(),
  ],
})
