import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Etiket', plural: 'Etiketler' },
  admin: { useAsTitle: 'title', group: 'Blog', defaultColumns: ['title', 'slug'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [{ name: 'title', type: 'text', required: true, label: 'Ad' }, slugField('tags')],
}
