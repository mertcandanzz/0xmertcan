// Server-side only. (No "server-only" import: payload.config loads this from plain Node scripts too.)
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * GitHub sign-in for the admin. Payload keeps its own email/password login;
 * this adds a second, server-verified way in (see `githubStrategy` on Users).
 *
 * - The session cookie is an HMAC-signed `{ uid, v, exp }` — no secrets inside.
 *   `v` must match the user's `githubSessionVersion`, which logout increments,
 *   so a copied cookie stops working once you sign out.
 * - The GitHub access token (used for repo sync) is stored AES-256-GCM encrypted.
 */

export const GH_SESSION_COOKIE = 'oxm-gh'
export const GH_STATE_COOKIE = 'oxm-gh-state'
export const GH_SESSION_TTL = 60 * 60 * 8 // seconds, same as the password session

const secret = () => {
  const s = process.env.PAYLOAD_SECRET
  if (!s) throw new Error('PAYLOAD_SECRET is not set')
  return s
}
const subkey = (label: string) => createHash('sha256').update(`${secret()}:${label}`).digest()

export const githubConfigured = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)

/** Comma-separated GitHub usernames allowed into the admin. Empty = nobody. */
export const allowedLogins = () =>
  (process.env.ADMIN_GITHUB_LOGINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

// ── Session cookie ─────────────────────────────────────────

type Session = { uid: string | number; v: number; exp: number }

export function signSession(session: Session) {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url')
  const mac = createHmac('sha256', subkey('gh-session')).update(body).digest('base64url')
  return `${body}.${mac}`
}

export function verifySession(value: string | undefined): Session | null {
  if (!value) return null
  const [body, mac] = value.split('.')
  if (!body || !mac) return null
  const expected = createHmac('sha256', subkey('gh-session')).update(body).digest()
  const given = Buffer.from(mac, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session
    if (typeof s.exp !== 'number' || s.exp * 1000 < Date.now()) return null
    return s
  } catch {
    return null
  }
}

// ── Token at rest ──────────────────────────────────────────

export function encryptToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', subkey('gh-token'), iv)
  const data = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

export function decryptToken(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const [iv, tag, data] = value.split('.').map((p) => Buffer.from(p, 'base64url'))
    const decipher = createDecipheriv('aes-256-gcm', subkey('gh-token'), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/** Same rule Payload applies to its own cookie: no cross-site use of the session. */
export function sameSiteRequest(headers: Headers, allowedOrigins: string[]) {
  const origin = headers.get('origin')
  if (origin) return allowedOrigins.includes(origin)
  const site = headers.get('sec-fetch-site')
  // Missing header (non-browser client) is rejected, as Payload does for its own cookie.
  return site === 'same-origin' || site === 'same-site' || site === 'none'
}

export function readCookie(headers: Headers, name: string) {
  const raw = headers.get('cookie') || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return undefined
}
