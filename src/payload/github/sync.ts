import { APIError, type PayloadRequest } from 'payload'

import { decryptToken } from '../../lib/githubAuth'
import { slugify } from '../../lib/slugify'

/**
 * GitHub → Projects sync.
 *
 * New repositories become DRAFT projects: the title starts as the repo name and
 * the summary as the repo description. README is never read. After creation the
 * editorial fields (title, summary, story, images, status, featured, slug) are
 * yours — later syncs only refresh the `github` metadata group.
 */

type Repo = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics?: string[]
  stargazers_count: number
  fork: boolean
  private: boolean
  archived: boolean
  created_at: string
  pushed_at: string
}

const API = 'https://api.github.com'

async function fetchRepos(token: string | null, login: string): Promise<Repo[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (token) headers.Authorization = `Bearer ${token}`
  // With a token: everything you own (private only if the token has `repo` scope). Without: public repos.
  const base = token ? `${API}/user/repos?affiliation=owner&sort=pushed` : `${API}/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed`
  const all: Repo[] = []
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${base}&per_page=100&page=${page}`, { headers, cache: 'no-store' })
    if (!res.ok) throw new APIError(`GitHub API ${res.status}: ${(await res.text()).slice(0, 160)}`, 502)
    const batch = (await res.json()) as Repo[]
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

const meta = (r: Repo) => ({
  repoId: r.id,
  fullName: r.full_name,
  url: r.html_url,
  description: r.description ?? '',
  language: r.language ?? '',
  topics: (r.topics ?? []).join(', '),
  stars: r.stargazers_count,
  isPrivate: r.private,
  isFork: r.fork,
  archived: r.archived,
  pushedAt: r.pushed_at,
  syncedAt: new Date().toISOString(),
})

export async function syncGithubRepos(req: PayloadRequest) {
  const { payload } = req
  const user = req.user as { id: string | number; githubLogin?: string | null } | null
  if (!user) throw new APIError('Giriş gerekli.', 401)

  // The signed-in admin's GitHub token (stored encrypted), then env fallbacks.
  const me = await payload.findByID({ collection: 'users', id: user.id, depth: 0, overrideAccess: true, showHiddenFields: true })
  const token = decryptToken(me.githubToken) ?? process.env.GITHUB_TOKEN ?? null
  const login = me.githubLogin || process.env.GITHUB_USERNAME || ''
  if (!token && !login) {
    throw new APIError('GitHub hesabı bağlı değil. Önce “GitHub ile giriş” yapın ya da GITHUB_USERNAME tanımlayın.', 400)
  }

  const repos = await fetchRepos(token, login)
  let created = 0
  let updated = 0

  for (const repo of repos) {
    const existing = await payload.find({
      collection: 'projects',
      where: { 'github.repoId': { equals: repo.id } },
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    })
    const doc = existing.docs[0]

    if (doc) {
      // Metadata only — never title, summary, story or anything you edited.
      await payload.update({
        collection: 'projects',
        id: doc.id,
        data: {
          github: meta(repo),
          ...(doc.repoUrl ? {} : { repoUrl: repo.private ? undefined : repo.html_url }),
          ...(doc.liveUrl || !repo.homepage ? {} : { liveUrl: repo.homepage }),
        },
        draft: doc._status !== 'published',
        overrideAccess: true,
        req,
      })
      updated++
      continue
    }

    // Unique slug: repo name, or name-gh / name-gh-2 … on collision.
    let slug = slugify(repo.name) || `repo-${repo.id}`
    for (let n = 0; ; n++) {
      const candidate = n === 0 ? slug : `${slug}-gh${n > 1 ? `-${n}` : ''}`
      const taken = await payload.count({ collection: 'projects', where: { slug: { equals: candidate } }, overrideAccess: true, req })
      if (!taken.totalDocs) {
        slug = candidate
        break
      }
    }

    await payload.create({
      collection: 'projects',
      draft: true,
      overrideAccess: true,
      req,
      data: {
        _status: 'draft',
        title: repo.name,
        slug,
        summary: (repo.description || 'GitHub deposu — açıklamayı admin panelinden düzenleyin.').slice(0, 280),
        kind: 'GitHub deposu',
        status: repo.archived ? 'archived' : 'active',
        year: new Date(repo.created_at).getFullYear(),
        featured: false,
        order: 100,
        isExample: false,
        previewStyle: 'terminal',
        previewCommand: `git clone ${repo.full_name}`,
        stack: [repo.language, ...(repo.topics ?? [])].filter(Boolean).slice(0, 8).map((name) => ({ name: name as string })),
        repoUrl: repo.private ? undefined : repo.html_url,
        liveUrl: repo.homepage || undefined,
        github: meta(repo),
      },
    })
    created++
  }

  return { total: repos.length, created, updated, private: repos.filter((r) => r.private).length, usedToken: Boolean(token) }
}
