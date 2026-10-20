export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const SITE_HOST = new URL(SITE_URL).host

export const NAV = [
  { href: '/projeler', label: 'Projeler', key: 'projects' },
  { href: '/blog', label: 'Blog', key: 'blog' },
  { href: '/hakkimda', label: 'Hakkımda', key: 'about' },
  { href: '/iletisim', label: 'İletişim', key: 'contact' },
] as const

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '')
/** 2026.10.20 — used in mono metadata rows. */
export const formatStamp = (iso?: string | null) => (iso ? shortFmt.format(new Date(iso)).split('.').reverse().join('.') : '')

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export const PROJECT_STATUS: Record<string, string> = {
  active: 'Aktif',
  shipped: 'Yayında',
  experiment: 'Deneysel',
  archived: 'Arşiv',
}

/** Same day? Used to hide "güncellendi" when it adds nothing. */
export const sameDay = (a?: string | null, b?: string | null) =>
  Boolean(a && b) && new Date(a!).toDateString() === new Date(b!).toDateString()
