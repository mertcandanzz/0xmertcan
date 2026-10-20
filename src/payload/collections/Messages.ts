import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/** Contact form submissions. Written only by the server action (local API). */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Mesaj', plural: 'Mesajlar' },
  admin: { useAsTitle: 'subject', group: 'Sistem', defaultColumns: ['name', 'email', 'subject', 'createdAt', 'handled'] },
  access: { read: authenticated, create: () => false, update: authenticated, delete: authenticated },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Ad' },
    { name: 'email', type: 'email', required: true, label: 'E-posta' },
    { name: 'subject', type: 'text', label: 'Konu' },
    { name: 'message', type: 'textarea', required: true, label: 'Mesaj' },
    { name: 'handled', type: 'checkbox', label: 'Yanıtlandı', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'fingerprint', type: 'text', index: true, admin: { readOnly: true, position: 'sidebar', description: 'Spam sınırlaması için IP özeti (ham IP saklanmaz).' } },
  ],
}
