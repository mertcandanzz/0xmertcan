import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { richEditor } from '../editor'
import { slugField } from '../fields/slug'
import { deriveContentFields } from '../hooks/derive'

const site = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Yazı', plural: 'Yazılar' },
  admin: {
    useAsTitle: 'title',
    group: 'Blog',
    defaultColumns: ['title', '_status', 'category', 'publishedAt', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'excerpt'],
    preview: (doc) => (doc?.slug ? `${site()}/preview/posts/${doc.slug}` : null),
  },
  versions: { drafts: true, maxPerDoc: 30 },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: '-publishedAt',
  hooks: { beforeChange: [deriveContentFields(['content'])] },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Başlık' },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      label: 'Özet',
      maxLength: 320,
      admin: { description: 'Listelerde ve paylaşımlarda görünür. En fazla 320 karakter.' },
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
    { name: 'content', type: 'richText', editor: richEditor, required: true, label: 'İçerik' },
    slugField('posts'),
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Yayın tarihi',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Boşsa ilk yayında otomatik atanır.',
      },
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategori', admin: { position: 'sidebar' } },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, label: 'Etiketler', admin: { position: 'sidebar' } },
    {
      name: 'isExample',
      type: 'checkbox',
      label: 'Örnek içerik',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'İşaretliyse sitede “örnek” rozetiyle gösterilir.' },
    },
    { name: 'readingTime', type: 'number', label: 'Okuma süresi (dk)', admin: { position: 'sidebar', readOnly: true } },
    { name: 'searchText', type: 'textarea', admin: { hidden: true } },
  ],
}
