import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectDetail } from '@/components/projects/ProjectDetail'
import { getProject, getProjects, media } from '@/lib/data'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Bulunamadı' }
  const meta = project.meta
  const img = media(meta?.image) ?? media(project.coverImage)
  return {
    title: meta?.title?.replace(/ · 0xmertcan$/, '') || project.title,
    description: meta?.description || project.summary,
    alternates: { canonical: `/projeler/${project.slug}` },
    openGraph: {
      type: 'article',
      url: `/projeler/${project.slug}`,
      images: img?.url ? [{ url: img.sizes?.og?.url || img.url, width: 1200, height: 630, alt: img.alt }] : [`/og?title=${encodeURIComponent(project.title)}&kind=proje`],
    },
  }
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()
  const all = await getProjects()
  const i = all.findIndex((p) => p.id === project.id)
  const next = all.length > 1 ? all[(i + 1) % all.length] : null
  return <ProjectDetail project={project} next={next} />
}
