import { getProjectAction } from '@/server/actions/project.actions'
import { taskRepository } from '@/server/repositories/task.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { TaskBoard } from '@/components/task/task-board'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { COLOR_STRIP_CLASS, APP_LOCALE } from '@/lib/constants'
import { ChevronLeft, Calendar, Settings2 } from 'lucide-react'

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

  const stripClass = project.color
    ? (COLOR_STRIP_CLASS[project.color] ?? 'strip-indigo')
    : 'strip-indigo'

  const dateRange = project.startDate && project.endDate
    ? `${new Date(project.startDate).toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })} – ${new Date(project.endDate).toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })}`
    : null

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
          <div className={`h-[3px] ${stripClass}`} />
          <div className="p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">

            {/* Left: back + identity */}
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href={`/dashboard/${slug}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('backButton')}
              </Link>

              <div className="w-px h-5 bg-border shrink-0" />

              <div className="flex items-center gap-3 min-w-0">
                <div className={`${stripClass} w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
                  {project.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold leading-tight truncate">{project.name}</h1>
                  {dateRange && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-[11px] text-muted-foreground tabular-nums">{dateRange}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <Link
              href={`/dashboard/${slug}/${projectId}/settings`}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors font-medium shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5 opacity-70" />
              {t('editTitle')}
            </Link>
          </div>

          {project.description && (
            <div className="px-5 md:px-6 pb-4 -mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>

        {/* Task board */}
        <TaskBoard
          tasks={tasks}
          projectId={projectId}
          workspaceSlug={slug}
          members={members}
          projectStartDate={project.startDate ? project.startDate.toISOString().split('T')[0] : undefined}
        />
      </div>
    </div>
  )
}
