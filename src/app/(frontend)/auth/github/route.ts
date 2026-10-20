import { randomBytes } from 'node:crypto'

import { NextResponse } from 'next/server'

import { GH_STATE_COOKIE, githubConfigured } from '@/lib/githubAuth'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Step 1: send the browser to GitHub with a one-time `state` bound to a cookie. */
export function GET() {
  if (!githubConfigured()) return NextResponse.redirect(`${SITE_URL}/admin/login?github=not-configured`)
  const state = randomBytes(24).toString('base64url')
  // `repo` is needed only to list private repositories; otherwise read-only profile scopes.
  const scope = process.env.GITHUB_INCLUDE_PRIVATE === 'true' ? 'read:user user:email repo' : 'read:user user:email'
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!)
  url.searchParams.set('redirect_uri', `${SITE_URL}/auth/github/callback`)
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  url.searchParams.set('allow_signup', 'false')
  const res = NextResponse.redirect(url)
  res.cookies.set(GH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/auth/github',
    maxAge: 600,
  })
  return res
}
