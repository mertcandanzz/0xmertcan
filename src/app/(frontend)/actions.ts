'use server'

import { createHash } from 'node:crypto'

import { headers } from 'next/headers'
import { z } from 'zod'

import { getPayloadClient, getSettings } from '@/lib/data'

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Partial<Record<'name' | 'email' | 'subject' | 'message', string>>
  /** Echoed back on error so the form keeps what was typed. */
  values?: Partial<Record<'name' | 'email' | 'subject' | 'message', string>>
}

const schema = z.object({
  name: z.string().trim().min(2, 'Adınızı yazın.').max(80, 'Ad çok uzun.'),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.').max(160),
  subject: z.string().trim().max(120, 'Konu çok uzun.').optional().default(''),
  message: z.string().trim().min(10, 'Mesaj en az 10 karakter olmalı.').max(4000, 'Mesaj 4000 karakteri aşmamalı.'),
})

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 3
const MIN_FILL_MS = 2500

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  const result = await handle(form)
  if (result.status === 'success') return result
  const values = Object.fromEntries((['name', 'email', 'subject', 'message'] as const).map((k) => [k, String(form.get(k) ?? '').slice(0, 4000)]))
  return { ...result, values }
}

async function handle(form: FormData): Promise<ContactState> {
  const settings = await getSettings()
  if (settings.contactFormEnabled === false) return { status: 'error', message: 'İletişim formu şu anda kapalı.' }

  // Honeypot + timing: bots fill hidden fields and submit instantly.
  const trap = String(form.get('website') ?? '')
  const started = Number(form.get('started') ?? 0)
  if (trap || !started || Date.now() - started < MIN_FILL_MS) {
    return { status: 'error', message: 'Gönderim doğrulanamadı. Lütfen birkaç saniye sonra tekrar deneyin.' }
  }

  const parsed = schema.safeParse({
    name: form.get('name'),
    email: form.get('email'),
    subject: form.get('subject') || undefined,
    message: form.get('message'),
  })
  if (!parsed.success) {
    const fieldErrors: ContactState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState['fieldErrors']>
      fieldErrors[key] ??= issue.message
    }
    return { status: 'error', message: 'Lütfen işaretli alanları düzeltin.', fieldErrors }
  }

  const h = await headers()
  const ip = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim()
  const fingerprint = createHash('sha256')
    .update(`${ip}:${process.env.PAYLOAD_SECRET}`)
    .digest('hex')
    .slice(0, 32)

  const payload = await getPayloadClient()
  // Rate limit persisted in the database, so it survives restarts and instances.
  const recent = await payload.count({
    collection: 'messages',
    overrideAccess: true,
    where: { and: [{ fingerprint: { equals: fingerprint } }, { createdAt: { greater_than: new Date(Date.now() - WINDOW_MS).toISOString() } }] },
  })
  if (recent.totalDocs >= MAX_PER_WINDOW) {
    return { status: 'error', message: 'Kısa sürede çok fazla mesaj gönderildi. Bir saat sonra tekrar deneyin.' }
  }

  try {
    await payload.create({
      collection: 'messages',
      overrideAccess: true,
      data: { ...parsed.data, subject: parsed.data.subject || undefined, fingerprint, handled: false },
    })
  } catch (err) {
    payload.logger.error({ err }, 'contact: failed to store message')
    return { status: 'error', message: 'Mesaj kaydedilemedi. Lütfen daha sonra tekrar deneyin.' }
  }

  return { status: 'success', message: 'Mesajınız kaydedildi. Teşekkürler.' }
}
