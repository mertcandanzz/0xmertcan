import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { anyone, authenticated } from '../access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
const MAX_BYTES = 8 * 1024 * 1024

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Görsel', plural: 'Medya' },
  admin: { group: 'İçerik', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  upload: {
    staticDir: path.resolve(dirname, '../../../media'),
    // SVG is intentionally excluded: it can carry scripts.
    mimeTypes: ALLOWED,
    focalPoint: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 300, position: 'centre' },
      { name: 'card', width: 960, height: 600, position: 'centre' },
      { name: 'wide', width: 1800 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumb',
  },
  hooks: {
    beforeOperation: [
      ({ req, operation }) => {
        if ((operation === 'create' || operation === 'update') && req.file) {
          if (!ALLOWED.includes(req.file.mimetype)) throw new APIError('Desteklenmeyen dosya türü. JPG, PNG, WebP, AVIF veya GIF yükleyin.', 400)
          if (req.file.size > MAX_BYTES) throw new APIError('Dosya 8 MB sınırını aşıyor.', 413)
        }
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: 'Alternatif metin', admin: { description: 'Görseli görmeyenler için kısa ve somut bir açıklama.' } },
    { name: 'caption', type: 'text', label: 'Açıklama' },
  ],
}
