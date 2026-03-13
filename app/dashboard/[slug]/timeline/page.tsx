import { getWorkspaceAction } from '@/server/actions/workspace.actions'
import { projectRepository } from '@/server/repositories/project.repository'
import { GanttChart } from '@/components/workspace/gantt-chart'
import { notFound } from 'next/navigation'

interface TimelinePageProps {
  params: Promise<{ slug: string }>
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { slug } = await params
  const result = await getWorkspaceAction(slug)
  if (!result) notFound()

  const { workspace } = result
  const projects = await projectRepository.findByWorkspace(workspace.id)

  const ganttProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color ?? '#6366f1',
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate: p.endDate ? p.endDate.toISOString() : null,
  }))

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <GanttChart projects={ganttProjects} />
      </div>
    </div>
  )
}
