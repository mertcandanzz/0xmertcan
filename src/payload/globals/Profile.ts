import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { richEditor } from '../editor'

export const SOCIAL_PLATFORMS = [
  { label: 'GitHub', value: 'github' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'X', value: 'x' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Mastodon', value: 'mastodon' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Diğer', value: 'other' },
]

export const Profile: GlobalConfig = {
  slug: 'profile',
  label: 'Profil',
  admin: { group: 'Site' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Kimlik',
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Ad soyad', defaultValue: 'Mertcan Yılmazer' },
            {
              name: 'role',
              type: 'text',
              required: true,
              label: 'Mesleki tanım',
              defaultValue: 'Yazılım mühendisi',
              admin: { description: 'Açılış ekranında adın yanında görünen kısa tanım.' },
            },
            { name: 'location', type: 'text', label: 'Konum', admin: { description: 'Boş bırakılırsa gösterilmez.' } },
            {
              name: 'availability',
              type: 'text',
              label: 'Durum satırı',
              admin: { description: 'Örn. “Yeni projelere açık”. Boş bırakılırsa gösterilmez.' },
            },
            {
              name: 'intro',
              type: 'textarea',
              required: true,
              label: 'Kısa giriş',
              admin: { description: 'Ana sayfadaki büyük giriş paragrafı. 1–3 cümle.' },
            },
            { name: 'portrait', type: 'upload', relationTo: 'media', label: 'Portre (isteğe bağlı)' },
          ],
        },
        {
          label: 'Hakkımda',
          fields: [
            { name: 'bio', type: 'richText', editor: richEditor, label: 'Biyografi' },
            {
              name: 'principles',
              type: 'array',
              label: 'Çalışma yaklaşımı',
              labels: { singular: 'İlke', plural: 'İlkeler' },
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Başlık' },
                { name: 'body', type: 'textarea', required: true, label: 'Açıklama' },
              ],
            },
            {
              name: 'experience',
              type: 'array',
              label: 'Deneyim',
              admin: { description: 'Boş bırakılırsa bölüm gizlenir.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', required: true, label: 'Pozisyon', admin: { width: '50%' } },
                    { name: 'org', type: 'text', required: true, label: 'Kurum', admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'start', type: 'text', label: 'Başlangıç', admin: { width: '33%', placeholder: '2023' } },
                    { name: 'end', type: 'text', label: 'Bitiş', admin: { width: '33%', placeholder: 'Bugün' } },
                    { name: 'url', type: 'text', label: 'Bağlantı', admin: { width: '34%' } },
                  ],
                },
                { name: 'summary', type: 'textarea', label: 'Kısa açıklama' },
              ],
            },
            {
              name: 'education',
              type: 'array',
              label: 'Eğitim',
              admin: { description: 'Boş bırakılırsa bölüm gizlenir.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', required: true, label: 'Program', admin: { width: '50%' } },
                    { name: 'org', type: 'text', required: true, label: 'Kurum', admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'start', type: 'text', label: 'Başlangıç', admin: { width: '50%' } },
                    { name: 'end', type: 'text', label: 'Bitiş', admin: { width: '50%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Teknolojiler',
          fields: [
            {
              name: 'stack',
              type: 'array',
              label: 'Teknoloji grupları',
              labels: { singular: 'Grup', plural: 'Gruplar' },
              fields: [
                { name: 'group', type: 'text', required: true, label: 'Grup adı', admin: { placeholder: 'languages' } },
                { name: 'items', type: 'text', required: true, label: 'Öğeler', admin: { description: 'Virgülle ayırın.' } },
                { name: 'note', type: 'text', label: 'Dipnot', admin: { description: 'İsteğe bağlı kısa not.' } },
              ],
            },
            {
              name: 'interests',
              type: 'array',
              label: 'İlgi alanları',
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Başlık' },
                { name: 'note', type: 'text', label: 'Not' },
              ],
            },
          ],
        },
        {
          label: 'İletişim',
          fields: [
            {
              name: 'email',
              type: 'email',
              label: 'Herkese açık e-posta',
              admin: { description: 'Boş bırakılırsa sitede e-posta gösterilmez.' },
            },
            {
              name: 'socials',
              type: 'array',
              label: 'Sosyal bağlantılar',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'platform', type: 'select', required: true, options: SOCIAL_PLATFORMS, admin: { width: '30%' } },
                    { name: 'handle', type: 'text', label: 'Kullanıcı adı', admin: { width: '30%' } },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      label: 'Bağlantı',
                      admin: { width: '40%' },
                      validate: (v: unknown) => (/^https:\/\/\S+$/.test(String(v ?? '')) ? true : 'https:// ile başlayan bir bağlantı girin.'),
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
