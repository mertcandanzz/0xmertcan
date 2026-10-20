import type { CollectionBeforeChangeHook } from 'payload'

import { lexicalToText, readingMinutes } from '../../lib/lexical'

/** Keeps derived fields (search index, reading time, publish date) in sync. */
export const deriveContentFields =
  (richTextFields: string[]): CollectionBeforeChangeHook =>
  ({ data, originalDoc }) => {
    const docs = richTextFields.map((f) => data[f]).filter(Boolean)
    const text = [data.title, data.excerpt ?? data.summary, ...docs.map((d) => lexicalToText(d))]
      .filter(Boolean)
      .join('\n')
    data.searchText = text.toLocaleLowerCase('tr').slice(0, 20000)
    data.readingTime = docs.reduce((n, d) => n + readingMinutes(d), 0) || 1
    if (data._status === 'published' && !data.publishedAt && !originalDoc?.publishedAt) {
      data.publishedAt = new Date().toISOString()
    }
    return data
  }
