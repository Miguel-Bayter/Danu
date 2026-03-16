import { getWorkspaceAction } from '@/server/actions/workspace.actions'
import { projectRepository } from '@/server/repositories/project.repository'
import { taskRepository } from '@/server/repositories/task.repository'
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

  const [projects, rawTasks] = await Promise.all([
    projectRepository.findByWorkspace(workspace.id),
    taskRepository.findByWorkspaceTimeline(workspace.id),
  ])

  // Exclude archived projects from the timeline
  const activeProjects = projects.filter((p) => p.status !== 'ARCHIVED')

  const ganttProjects = activeProjects.map((p) => ({
    id:        p.id,
    name:      p.name,
    color:     p.color ?? '#6366f1',
    status:    p.status,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    endDate:   p.endDate   ? p.endDate.toISOString()   : null,
  }))

  const ganttTasks = rawTasks.map((t) => ({
    id:           t.id,
    title:        t.title,
    priority:     t.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status:       t.status   as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE',
    startDate:    t.startDate   ? t.startDate.toISOString()   : null,
    createdAt:    t.createdAt.toISOString(),
    dueDate:      t.dueDate     ? t.dueDate.toISOString()     : null,
    completedAt:  t.completedAt ? t.completedAt.toISOString() : null,
    subtaskCount: t._count.subtasks,
    projectId:    t.project.id,
    projectName:  t.project.name,
    projectColor: t.project.color ?? '#6366f1',
    assignee: t.assignee
      ? { id: t.assignee.id, name: t.assignee.name, image: t.assignee.image }
      : null,
  }))

  return (
    <div className="h-full overflow-hidden">
      <GanttChart
        projects={ganttProjects}
        tasks={ganttTasks}
        slug={slug}
        workspaceName={workspace.name}
      />
    </div>
  )
}
