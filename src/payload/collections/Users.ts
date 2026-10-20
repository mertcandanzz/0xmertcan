import type { AuthStrategy, CollectionConfig } from 'payload'

import { GH_SESSION_COOKIE, readCookie, sameSiteRequest, verifySession } from '../../lib/githubAuth'
import { authenticated } from '../access'

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** Accepts the signed GitHub session cookie set by /auth/github/callback. */
const githubStrategy: AuthStrategy = {
  name: 'github',
  authenticate: async ({ headers, payload }) => {
    const session = verifySession(readCookie(headers, GH_SESSION_COOKIE))
    if (!session || !sameSiteRequest(headers, [siteUrl()])) return { user: null }
    try {
      const user = await payload.findByID({ collection: 'users', id: session.uid, depth: 0, overrideAccess: true, showHiddenFields: true })
      if (!user || (user.githubSessionVersion ?? 0) !== session.v) return { user: null }
      return { user: { ...user, collection: 'users', _strategy: 'github' } }
    } catch {
      return { user: null }
    }
  },
}

// Fields only the server writes: hidden in the admin and unreadable over the API.
const serverOnly = { read: () => false, create: () => false, update: () => false }

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Yönetici', plural: 'Yöneticiler' },
  admin: { useAsTitle: 'email', group: 'Sistem', defaultColumns: ['email', 'name', 'githubLogin'] },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
    strategies: [githubStrategy],
  },
  // Only signed-in admins can see or manage accounts. Payload still allows the
  // very first account to be created at /admin/create-first-user.
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    // Signing out invalidates any GitHub session cookie for this user.
    afterLogout: [
      async ({ req }) => {
        const user = req.user
        if (!user || user.collection !== 'users') return
        const current = (user as { githubSessionVersion?: number }).githubSessionVersion ?? 0
        await req.payload.update({ collection: 'users', id: user.id, data: { githubSessionVersion: current + 1 }, overrideAccess: true, req })
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Ad' },
    {
      name: 'githubLogin',
      type: 'text',
      label: 'GitHub kullanıcı adı',
      index: true,
      admin: { readOnly: true, description: 'GitHub ile giriş yapıldığında otomatik dolar. Repo senkronu bu hesabı kullanır.' },
    },
    { name: 'githubId', type: 'number', index: true, admin: { hidden: true }, access: serverOnly },
    { name: 'githubToken', type: 'text', admin: { hidden: true }, access: serverOnly },
    { name: 'githubSessionVersion', type: 'number', defaultValue: 0, admin: { hidden: true }, access: serverOnly },
  ],
}
