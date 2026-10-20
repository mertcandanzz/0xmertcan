/**
 * Creates an admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD if no user exists.
 * Run: npx payload run scripts/create-admin.ts
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config })
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (!email || !password) {
  payload.logger.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD first.')
  process.exit(1)
}
const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
if (totalDocs) {
  payload.logger.info('An admin already exists — nothing to do.')
} else {
  await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, name: 'Admin' } })
  payload.logger.info(`Created admin ${email}`)
}
process.exit(0)
