import { getProjectAction } from '@/server/actions/project.actions'
import { taskRepository } from '@/server/repositories/task.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { TaskBoard } from '@/components/task/task-board'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface ProjectPageProps {
  params: Promise<{ slug: string; projectId: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug, projectId } = await params
  const project = await getProjectAction(projectId)
  if (!project) notFound()

  const [tasks, workspace] = await Promise.all([
    taskRepository.findByProject(projectId),
    workspaceRepository.findBySlug(slug),
  ])

  const members = workspace?.members ?? []
  const t = await getTranslations('project')

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${slug}`}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← {t('cancelButton')}
            </Link>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/${slug}/${projectId}/settings`}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              {t('editTitle')}
            </Link>
          </div>
        </div>

        {project.description && (
          <p className="text-muted-foreground text-sm">{project.description}</p>
        )}

        {/* Task board */}
        <TaskBoard
          tasks={tasks}
          projectId={projectId}
          workspaceSlug={slug}
          members={members}
        />
      </div>
    </div>
  )
}
