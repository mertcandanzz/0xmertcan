import type { Metadata } from 'next'

import { ContactSection } from '@/components/contact/ContactSection'
import { getProfile, getSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'Bir proje, bir soru ya da bir yazı hakkında not bırakın.',
  alternates: { canonical: '/iletisim' },
}

export default async function ContactPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()])
  return (
    <div className="pt-[calc(var(--header-h)+1rem)] md:pt-[calc(var(--header-h)+3rem)]">
      <ContactSection profile={profile} formEnabled={settings.contactFormEnabled !== false} index="06" as="h1" />
    </div>
  )
}
