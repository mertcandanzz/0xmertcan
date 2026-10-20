import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site ayarları',
  admin: { group: 'Site' },
  access: { read: anyone, update: authenticated },
  fields: [
    { name: 'siteTitle', type: 'text', required: true, label: 'Site başlığı', defaultValue: '0xmertcan' },
    {
      name: 'siteDescription',
      type: 'textarea',
      required: true,
      label: 'Varsayılan açıklama',
      defaultValue: 'Mertcan Yılmazer — yazılım, sistemler ve arayüzler üzerine notlar ve projeler.',
      admin: { description: 'Arama motorları ve sosyal paylaşımlar için varsayılan açıklama.' },
    },
    {
      name: 'heroBackground',
      type: 'select',
      label: 'Hero arka planı',
      required: true,
      defaultValue: 'topography',
      options: [
        { label: 'Topografya — kırmızı kontur çizgileri', value: 'topography' },
        { label: 'Işık hüzmeleri — üstten spot ışığı', value: 'rays' },
        { label: 'Şekil dalgaları — şekil alanı', value: 'shapes' },
      ],
      admin: { description: 'Ana sayfa açılışının arka planı. Değişiklik bir sonraki sayfa yüklemesinde görünür.' },
    },
    { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Varsayılan paylaşım görseli', admin: { description: 'Boşsa marka görseli otomatik üretilir.' } },
    {
      name: 'contactFormEnabled',
      type: 'checkbox',
      label: 'İletişim formu açık',
      defaultValue: true,
      admin: { description: 'Gelen mesajlar “Mesajlar” koleksiyonuna kaydedilir.' },
    },
    { name: 'footerNote', type: 'text', label: 'Footer notu', admin: { description: 'Örn. “İstanbul’dan, terminal başından.” Boş bırakılabilir.' } },
  ],
}
