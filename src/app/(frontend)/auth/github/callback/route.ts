import { randomBytes, timingSafeEqual } from 'node:crypto'

import { type NextRequest, NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/data'
import { allowedLogins, encryptToken, GH_SESSION_COOKIE, GH_SESSION_TTL, GH_STATE_COOKIE, githubConfigured, signSession } from '@/lib/githubAuth'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

const fail = (reason: string) => {
  const res = NextResponse.redirect(`${SITE_URL}/admin/login?github=${reason}`)
  res.cookies.delete({ name: GH_STATE_COOKIE, path: '/auth/github' })
  return res
}

type GhUser = { id: number; login: string; name: string | null; email: string | null }
type GhEmail = { email: string; primary: boolean; verified: boolean }

/** Step 2: verify state, exchange the code, check the allow-list, start the admin session. */
export async function GET(req: NextRequest) {
  if (!githubConfigured()) return fail('not-configured')
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const expected = req.cookies.get(GH_STATE_COOKIE)?.value
  if (!code || !state || !expected || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
    return fail('state')
  }

  // Exchange the one-time code for an access token.
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${SITE_URL}/auth/github/callback`,
    }),
    cache: 'no-store',
  })
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as { access_token?: string }
  const token = tokenJson.access_token
  if (!token) return fail('token')

  const gh = (path: string) =>
    fetch(`https://api.github.com${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      cache: 'no-store',
    })
  const meRes = await gh('/user')
  if (!meRes.ok) return fail('profile')
  const me = (await meRes.json()) as GhUser

  // Only allow-listed GitHub accounts may enter the admin.
  if (!allowedLogins().includes(me.login.toLowerCase())) return fail('denied')

  let email = me.email
  if (!email) {
    const emails = (await gh('/user/emails').then((r) => (r.ok ? r.json() : []))) as GhEmail[]
    email = emails.find((e) => e.primary && e.verified)?.email ?? null
  }

  const payload = await getPayloadClient()
  // Match an existing admin by GitHub id, then by e-mail; otherwise create one.
  let user =
    (await payload.find({ collection: 'users', where: { githubId: { equals: me.id } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true })).docs[0] ??
    (email ? (await payload.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true })).docs[0] : undefined)

  const data = { githubId: me.id, githubLogin: me.login, githubToken: encryptToken(token) }
  if (user) {
    user = await payload.update({ collection: 'users', id: user.id, data, overrideAccess: true, showHiddenFields: true })
  } else {
    user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      showHiddenFields: true,
      data: {
        ...data,
        email: (email ?? `${me.id}+${me.login}@users.noreply.github.com`).toLowerCase(),
        name: me.name ?? me.login,
        // Random, never shown: this account signs in through GitHub.
        password: randomBytes(32).toString('base64url'),
      },
    })
  }

  const exp = Math.floor(Date.now() / 1000) + GH_SESSION_TTL
  const res = NextResponse.redirect(`${SITE_URL}/admin`)
  res.cookies.delete({ name: GH_STATE_COOKIE, path: '/auth/github' })
  res.cookies.set(GH_SESSION_COOKIE, signSession({ uid: user.id, v: user.githubSessionVersion ?? 0, exp }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GH_SESSION_TTL,
  })
  return res
}
