import type { CollectionSlug, PayloadRequest, TextField } from 'payload'

import { slugify, SLUG_PATTERN } from '../../lib/slugify'

/**
 * Slug field: generated from `title` when empty, normalised on save, and
 * checked for collisions with a readable error instead of a raw DB error.
 */
export function slugField(collection: CollectionSlug, from = 'title'): TextField {
  return {
    name: 'slug',
    type: 'text',
    // Not marked required: the hook fills it from the title on save, then validate enforces it.
    unique: true,
    index: true,
    label: 'Slug',
    admin: {
      position: 'sidebar',
      description: 'URL parçası. Boş bırakılırsa başlıktan üretilir. Yalnızca a-z, 0-9 ve tire.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const source = typeof value === 'string' && value.trim() ? value : (data?.[from] as string | undefined)
          return source ? slugify(source) || `icerik-${Date.now().toString(36)}` : value
        },
      ],
    },
    validate: async (value: unknown, { req, id }: { req: PayloadRequest; id?: string | number }) => {
      // Empty is fine in the form; beforeValidate derives it from the title on save.
      if (value === undefined || value === null || value === '') return true
      if (typeof value !== 'string') return 'Geçersiz slug.'
      if (!SLUG_PATTERN.test(value)) return 'Slug yalnızca küçük harf, rakam ve tire içerebilir.'
      const existing = await req.payload.find({
        collection,
        where: { and: [{ slug: { equals: value } }, ...(id ? [{ id: { not_equals: id } }] : [])] },
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
        pagination: false,
        req,
      })
      if (existing.docs.length) return `"${value}" slug'ı zaten kullanılıyor. Farklı bir slug seçin.`
      return true
    },
  }
}
