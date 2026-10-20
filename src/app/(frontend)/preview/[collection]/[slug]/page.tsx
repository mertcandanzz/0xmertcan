import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostArticle } from '@/components/blog/PostArticle'
import { ProjectDetail } from '@/components/projects/ProjectDetail'
import { getPost, getProject, getViewer } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Önizleme',
  robots: { index: false, follow: false, nocache: true },
}

type Params = Promise<{ collection: string; slug: string }>

/**
 * Draft preview. Authorised on the server against the Payload session cookie;
 * anyone without an admin session gets a 404, so drafts never leak.
 */
export default async function PreviewPage({ params }: { params: Params }) {
  const { collection, slug } = await params
  const viewer = await getViewer()
  if (!viewer) notFound()

  const doc = collection === 'posts' ? await getPost(slug, { draft: true }) : collection === 'projects' ? await getProject(slug, { draft: true }) : null
  if (!doc) notFound()

  const status = (doc as { _status?: string })._status
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-line-strong bg-surface/95 px-4 py-2 shadow-lg backdrop-blur" role="status">
        <span className={`size-2 rounded-full ${status === 'published' ? 'bg-[#6aa66f]' : 'bg-accent'}`} aria-hidden="true" />
        <span className="meta text-fg-soft">önizleme · {status === 'published' ? 'yayında' : 'taslak'}</span>
        <a href={`/admin/collections/${collection}/${doc.id}`} className="meta link-quiet text-fg">
          düzenle
        </a>
      </div>
      {collection === 'posts' ? <PostArticle post={doc as never} /> : <ProjectDetail project={doc as never} />}
    </>
  )
}
