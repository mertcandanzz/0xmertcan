import type { CollectionConfig, RichTextField } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { richEditor } from '../editor'
import { slugField } from '../fields/slug'
import { syncGithubRepos } from '../github/sync'
import { deriveContentFields } from '../hooks/derive'

const site = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const section = (name: string, label: string, description: string): RichTextField => ({
  name,
  type: 'richText',
  editor: richEditor,
  label,
  admin: { description },
})

function urlOrEmpty(value: unknown): true | string {
  if (!value) return true
  try {
    const u = new URL(String(value))
    return u.protocol === 'https:' || u.protocol === 'http:' ? true : 'http(s) bağlantısı girin.'
  } catch {
    return 'Geçerli bir bağlantı girin (https://…).'
  }
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Proje', plural: 'Projeler' },
  admin: {
    useAsTitle: 'title',
    group: 'İçerik',
    defaultColumns: ['title', '_status', 'status', 'featured', 'year'],
    preview: (doc) => (doc?.slug ? `${site()}/preview/projects/${doc.slug}` : null),
    components: { beforeListTable: ['/payload/admin/GithubSync#GithubSyncButton'] },
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrAuthenticated, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  endpoints: [
    {
      // POST /api/projects/github-sync — signed-in admins only.
      path: '/github-sync',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ error: 'Giriş gerekli.' }, { status: 401 })
        try {
          return Response.json(await syncGithubRepos(req))
        } catch (err) {
          const e = err as { message?: string; status?: number }
          return Response.json({ error: e.message ?? 'Senkron başarısız.' }, { status: e.status ?? 500 })
        }
      },
    },
  ],
  hooks: { beforeChange: [deriveContentFields(['problem', 'approach', 'decisions', 'outcome', 'learnings'])] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Özet',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Başlık' },
            { name: 'summary', type: 'textarea', required: true, label: 'Kısa açıklama', maxLength: 280 },
            {
              type: 'row',
              fields: [
                { name: 'role', type: 'text', label: 'Rol', admin: { width: '50%', description: 'Örn. “Tek geliştirici”, “Backend”.' } },
                { name: 'kind', type: 'text', label: 'Tür', admin: { width: '50%', description: 'Örn. “CLI aracı”, “Web uygulaması”.' } },
              ],
            },
            {
              name: 'stack',
              type: 'array',
              label: 'Teknolojiler',
              labels: { singular: 'Teknoloji', plural: 'Teknolojiler' },
              fields: [{ name: 'name', type: 'text', required: true, label: 'Ad' }],
            },
            {
              type: 'row',
              fields: [
                { name: 'repoUrl', type: 'text', label: 'GitHub / kaynak', admin: { width: '50%' }, validate: urlOrEmpty },
                { name: 'liveUrl', type: 'text', label: 'Canlı demo', admin: { width: '50%' }, validate: urlOrEmpty },
              ],
            },
          ],
        },
        {
          label: 'Görsel',
          fields: [
            { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Kapak görseli' },
            {
              name: 'previewStyle',
              type: 'select',
              label: 'Görsel yoksa önizleme',
              defaultValue: 'terminal',
              options: [
                { label: 'Terminal oturumu', value: 'terminal' },
                { label: 'Sistem şeması', value: 'diagram' },
                { label: 'Tipografik', value: 'type' },
              ],
              admin: { description: 'Kapak görseli yoksa proje bu üretilmiş önizlemeyle sunulur.' },
            },
            {
              name: 'previewCommand',
              type: 'text',
              label: 'Önizleme komutu',
              admin: { description: 'Terminal önizlemesinde gösterilen komut. Örn. “oxm deploy --dry-run”.' },
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Galeri',
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Hikâye',
          fields: [
            section('problem', 'Problem', 'Neyi, kimin için çözüyordu?'),
            section('approach', 'Yaklaşım', 'Nasıl ilerlendi?'),
            section('decisions', 'Teknik kararlar', 'Önemli seçimler ve gerekçeleri.'),
            section('outcome', 'Sonuç', 'Ne çıktı ortaya? Ölçülebilir veri yoksa uydurmayın.'),
            section('learnings', 'Öğrenilenler', 'Bir dahakine farklı yapılacaklar.'),
          ],
        },
      ],
    },
    slugField('projects'),
    {
      name: 'status',
      type: 'select',
      label: 'Proje durumu',
      enumName: 'enum_projects_state',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Aktif', value: 'active' },
        { label: 'Yayında', value: 'shipped' },
        { label: 'Deneysel', value: 'experiment' },
        { label: 'Arşiv', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'year', type: 'number', label: 'Yıl', admin: { position: 'sidebar' } },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Seçilmiş proje',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Ana sayfada gösterilir.' },
    },
    { name: 'order', type: 'number', label: 'Sıra', defaultValue: 100, admin: { position: 'sidebar', description: 'Küçük sayı önce.' } },
    {
      name: 'isExample',
      type: 'checkbox',
      label: 'Örnek içerik',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'İşaretliyse sitede “örnek” rozetiyle gösterilir.' },
    },
    {
      name: 'github',
      type: 'group',
      label: 'GitHub',
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.github?.repoId),
        description: 'Senkronla güncellenir; başlık, özet ve hikâye alanlarına dokunulmaz.',
      },
      fields: [
        { name: 'repoId', type: 'number', index: true, label: 'Depo ID', admin: { readOnly: true } },
        { name: 'fullName', type: 'text', label: 'Depo', admin: { readOnly: true } },
        { name: 'url', type: 'text', label: 'Adres', admin: { readOnly: true } },
        { name: 'description', type: 'textarea', label: 'GitHub açıklaması', admin: { readOnly: true } },
        { name: 'language', type: 'text', label: 'Dil', admin: { readOnly: true } },
        { name: 'topics', type: 'text', label: 'Konular', admin: { readOnly: true } },
        { name: 'stars', type: 'number', label: 'Yıldız', admin: { readOnly: true } },
        {
          type: 'row',
          fields: [
            { name: 'isPrivate', type: 'checkbox', label: 'Gizli', admin: { readOnly: true } },
            { name: 'isFork', type: 'checkbox', label: 'Fork', admin: { readOnly: true } },
            { name: 'archived', type: 'checkbox', label: 'Arşiv', admin: { readOnly: true } },
          ],
        },
        { name: 'pushedAt', type: 'date', label: 'Son push', admin: { readOnly: true } },
        { name: 'syncedAt', type: 'date', label: 'Son senkron', admin: { readOnly: true } },
      ],
    },
    { name: 'publishedAt', type: 'date', admin: { hidden: true } },
    { name: 'readingTime', type: 'number', admin: { hidden: true } },
    { name: 'searchText', type: 'textarea', admin: { hidden: true } },
  ],
}
