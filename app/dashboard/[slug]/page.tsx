import { getWorkspaceAction } from '@/server/actions/workspace.actions'
import { projectRepository } from '@/server/repositories/project.repository'
import { taskRepository } from '@/server/repositories/task.repository'
import { CreateProjectButton } from '@/components/project/create-project-button'
import { ProjectCard } from '@/components/project/project-card'
import { InviteMemberButton } from '@/components/workspace/invite-member-button'
import { WeeklyReportButton } from '@/components/workspace/weekly-report-button'
import { DeleteWorkspaceButton } from '@/components/workspace/delete-workspace-button'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { WorkspaceRole, Priority } from '@prisma/client'
import { PRIORITY_COLORS, APP_LOCALE } from '@/lib/constants'
import { CalendarDays } from 'lucide-react'

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params
  const result = await getWorkspaceAction(slug)
  if (!result) notFound()

  const { workspace, role } = result

  const [projects, metrics, urgentTasks, healthScore] = await Promise.all([
    projectRepository.findByWorkspace(workspace.id),
    taskRepository.getWorkspaceMetrics(workspace.id),
    taskRepository.findUrgentByWorkspace(workspace.id, 5),
    taskRepository.getHealthScore(workspace.id),
  ])

  const t = await getTranslations('workspace')
  const tt = await getTranslations('task')
  const th = await getTranslations('healthScore')

  const completionPct = metrics.total > 0
    ? Math.round((metrics.done / metrics.total) * 100)
    : 0

  const canInvite = role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {workspace.members.length === 1
                ? t('members_one', { count: 1 })
                : t('members_other', { count: workspace.members.length })}
              {' · '}
              {projects.length === 1
                ? t('projects_one', { count: 1 })
                : t('projects_other', { count: projects.length })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WeeklyReportButton workspaceId={workspace.id} workspaceName={workspace.name} />
            <Link
              href={`/dashboard/${slug}/timeline`}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              {t('timelineButton')}
            </Link>
            {canInvite && (
              <InviteMemberButton workspaceId={workspace.id} workspaceName={workspace.name} />
            )}
            <CreateProjectButton workspaceId={workspace.id} workspaceSlug={slug} />
          </div>
        </div>

        {/* Metric cards + Health Score */}
        {metrics.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label={t('metricsTotal')}
              value={metrics.total}
              color="text-foreground"
            />
            <MetricCard
              label={t('metricsDone')}
              value={metrics.done}
              sub={`${completionPct}%`}
              color="text-green-600 dark:text-green-400"
            />
            <MetricCard
              label={t('metricsOverdue')}
              value={metrics.overdue}
              color={metrics.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
            />
            <MetricCard
              label={t('metricsActiveProjects')}
              value={metrics.activeProjects}
              color="text-primary"
            />
          </div>
        )}

        {/* Health Score */}
        {healthScore && (
          <div className="border rounded-xl p-5 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {th('title')}
              </p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${healthScoreColor(healthScore.score, 'badge')}`}
              >
                {healthScoreLabel(healthScore.score, th)}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className={`text-3xl font-bold ${healthScoreColor(healthScore.score, 'text')}`}>
                {healthScore.score}
              </span>
              <span className="text-sm text-muted-foreground mb-0.5">/ 100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${healthScoreColor(healthScore.score, 'bar')}`}
                style={{ width: `${healthScore.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Urgent tasks */}
        {urgentTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('urgentTitle')}
            </h2>
            <div className="space-y-2">
              {urgentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/${slug}/${task.project.id}`}
                  className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-card hover:border-primary/50 transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: task.project.color ?? '#6366f1' }}
                  />
                  <span className="text-sm font-medium flex-1 truncate">{task.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_COLORS[task.priority as Priority]}`}>
                    {tt(`priority.${task.priority}`)}
                  </span>
                  {task.dueDate ? (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(task.dueDate).toLocaleDateString(APP_LOCALE)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">{t('noDueDate')}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Danger zone — owner only */}
        {role === WorkspaceRole.OWNER && (
          <DeleteWorkspaceButton workspaceId={workspace.id} />
        )}

        {/* Projects */}
        <div className="space-y-3">
          {projects.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('allProjectsTitle')}
            </h2>
          )}

          {projects.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">{t('noProjects')}</p>
              <p className="text-sm">{t('noProjectsDescription')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} workspaceSlug={slug} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Helper: health score color + label ──────────────────────────────────────

function healthScoreColor(score: number, variant: 'text' | 'badge' | 'bar') {
  if (score >= 75) {
    return variant === 'text'
      ? 'text-green-600 dark:text-green-400'
      : variant === 'badge'
        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
        : 'bg-green-500'
  }
  if (score >= 50) {
    return variant === 'text'
      ? 'text-yellow-600 dark:text-yellow-400'
      : variant === 'badge'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
        : 'bg-yellow-500'
  }
  if (score >= 25) {
    return variant === 'text'
      ? 'text-orange-600 dark:text-orange-400'
      : variant === 'badge'
        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
        : 'bg-orange-500'
  }
  return variant === 'text'
    ? 'text-red-600 dark:text-red-400'
    : variant === 'badge'
      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
      : 'bg-red-500'
}

function healthScoreLabel(score: number, t: (key: string) => string) {
  if (score >= 75) return t('excellent')
  if (score >= 50) return t('good')
  if (score >= 25) return t('atRisk')
  return t('critical')
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: number
  sub?: string
  color: string
}) {
  return (
    <div className="border rounded-xl p-5 bg-card space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        {sub && <span className="text-sm text-muted-foreground mb-0.5">{sub}</span>}
      </div>
    </div>
  )
}
