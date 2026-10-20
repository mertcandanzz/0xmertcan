import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { tr } from '@payloadcms/translations/languages/tr'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { migrations } from './migrations'
import { Categories } from './payload/collections/Categories'
import { Media } from './payload/collections/Media'
import { Messages } from './payload/collections/Messages'
import { Posts } from './payload/collections/Posts'
import { Projects } from './payload/collections/Projects'
import { Tags } from './payload/collections/Tags'
import { Users } from './payload/collections/Users'
import { richEditor } from './payload/editor'
import { Profile } from './payload/globals/Profile'
import { Settings } from './payload/globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
if (!secret) throw new Error('PAYLOAD_SECRET is not set. Copy .env.example to .env and fill it in.')

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const useS3 = Boolean(process.env.S3_BUCKET)

export default buildConfig({
  serverURL: siteUrl,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · 0xmertcan admin',
      robots: 'noindex, nofollow',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    components: {
      graphics: {
        Logo: '/payload/admin/Brand#AdminLogo',
        Icon: '/payload/admin/Brand#AdminIcon',
      },
      afterLogin: ['/payload/admin/GithubLogin#GithubLoginButton'],
    },
    dateFormat: 'd MMMM yyyy HH:mm',
    theme: 'dark',
  },
  i18n: {
    supportedLanguages: { tr, en },
    fallbackLanguage: 'tr',
  },
  collections: [Posts, Projects, Categories, Tags, Media, Messages, Users],
  globals: [Profile, Settings],
  editor: richEditor,
  secret,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Dev uses schema push; production applies committed migrations on boot.
    prodMigrations: migrations,
  }),
  upload: { limits: { fileSize: 8 * 1024 * 1024 } },
  cors: [siteUrl],
  csrf: [siteUrl],
  sharp,
  plugins: [
    seoPlugin({
      collections: ['posts', 'projects'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => (doc?.title ? `${doc.title} · 0xmertcan` : '0xmertcan'),
      generateDescription: ({ doc }) => doc?.excerpt || doc?.summary || '',
      generateURL: ({ doc, collectionSlug }) =>
        `${siteUrl}/${collectionSlug === 'posts' ? 'blog' : 'projeler'}/${doc?.slug ?? ''}`,
      fields: ({ defaultFields }) => defaultFields,
    }),
    ...(useS3
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET!,
            config: {
              region: process.env.S3_REGION,
              endpoint: process.env.S3_ENDPOINT || undefined,
              forcePathStyle: Boolean(process.env.S3_ENDPOINT),
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
})
