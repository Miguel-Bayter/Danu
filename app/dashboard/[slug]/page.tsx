import { getWorkspaceAction } from '@/server/actions/workspace.actions'
import { projectRepository } from '@/server/repositories/project.repository'
import { taskRepository } from '@/server/repositories/task.repository'
import { CreateProjectButton } from '@/components/project/create-project-button'
import { ProjectCard } from '@/components/project/project-card'
import { InviteMemberButton } from '@/components/workspace/invite-member-button'
import { WeeklyReportButton } from '@/components/workspace/weekly-report-button'
import { DeleteWorkspaceButton } from '@/components/workspace/delete-workspace-button'
import { VelocityRing } from '@/components/ui/velocity-ring'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { WorkspaceRole, Priority } from '@prisma/client'
import { PRIORITY_COLORS, APP_LOCALE, getGradientClass, COLOR_DOT_CLASS } from '@/lib/constants'
import { CalendarDays, ListChecks, CheckCircle2, AlertCircle, Layers } from 'lucide-react'

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
  const scoreClasses = getHealthScoreClasses(healthScore?.score ?? 0)

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Workspace header card — gradient fill + white text header */}
        <div className="rounded-2xl border border-border overflow-hidden shadow-card">
          {/* Gradient header area — same pattern as workspace-card */}
          <div className={`${getGradientClass(workspace.name)} px-5 md:px-6 py-5 flex items-center gap-4 relative`}>
            <div className="absolute inset-0 bg-white/[0.06] pointer-events-none" />
            <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shrink-0 ring-1 ring-white/25 select-none">
              {workspace.name[0].toUpperCase()}
            </div>
            <div className="relative min-w-0">
              <h1 className="text-xl font-bold text-white leading-tight">{workspace.name}</h1>
              <p className="text-white/60 text-xs mt-0.5 font-medium">
                {workspace.members.length === 1
                  ? t('members_one', { count: 1 })
                  : t('members_other', { count: workspace.members.length })}
                {' · '}
                {projects.length === 1
                  ? t('projects_one', { count: 1 })
                  : t('projects_other', { count: projects.length })}
              </p>
            </div>
          </div>
          {/* Action bar — mobile: 2 deliberate rows; desktop: 1 row */}
          <div className="bg-card px-4 sm:px-6 py-3 border-t border-border space-y-2 sm:space-y-0">
            {/* Row 1: utility actions */}
            <div className="flex items-center gap-2">
              <WeeklyReportButton workspaceId={workspace.id} workspaceName={workspace.name} />
              <Link
                href={`/dashboard/${slug}/timeline`}
                className="flex items-center gap-1.5 text-sm px-3 py-2.5 rounded-lg border border-border hover:bg-accent transition-colors font-medium min-h-[44px]"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>{t('timelineButton')}</span>
              </Link>
              {/* Desktop: show manage actions in same row */}
              <div className="hidden sm:flex items-center gap-2 ml-auto">
                {canInvite && <InviteMemberButton workspaceId={workspace.id} workspaceName={workspace.name} />}
                <CreateProjectButton workspaceId={workspace.id} workspaceSlug={slug} />
              </div>
            </div>
            {/* Row 2: manage actions — mobile only */}
            <div className="flex items-center gap-2 sm:hidden">
              {canInvite && (
                <div className="flex-1">
                  <InviteMemberButton workspaceId={workspace.id} workspaceName={workspace.name} fullWidth />
                </div>
              )}
              <CreateProjectButton workspaceId={workspace.id} workspaceSlug={slug} />
            </div>
          </div>
        </div>

        {/* Bloomberg metric cards */}
        {metrics.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label={t('metricsTotal')}
              value={metrics.total}
              icon={<ListChecks className="w-3.5 h-3.5" />}
              textClass="text-foreground"
              borderClass="border-l-primary"
            />
            <MetricCard
              label={t('metricsDone')}
              value={metrics.done}
              sub={`${completionPct}%`}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              textClass="text-status-success"
              borderClass="border-l-status-success"
            />
            <MetricCard
              label={t('metricsOverdue')}
              value={metrics.overdue}
              icon={<AlertCircle className="w-3.5 h-3.5" />}
              textClass={metrics.overdue > 0 ? 'text-status-danger' : 'text-foreground'}
              borderClass={metrics.overdue > 0 ? 'border-l-status-danger' : 'border-l-primary'}
            />
            <MetricCard
              label={t('metricsActiveProjects')}
              value={metrics.activeProjects}
              icon={<Layers className="w-3.5 h-3.5" />}
              textClass="text-primary"
              borderClass="border-l-primary"
            />
          </div>
        )}

        {/* Health Score — Velocity Ring as centerpiece */}
        {healthScore && (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card">
            <div className={`h-[3px] ${scoreClasses.strip}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                  {th('title')}
                </p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${scoreClasses.badge}`}>
                  {healthScoreLabel(healthScore.score, th)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <VelocityRing score={healthScore.score} size={56} strokeWidth={4.5} />
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tabular-nums leading-none ${scoreClasses.text}`}>
                    {healthScore.score}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Urgent tasks */}
        {urgentTasks.length > 0 && (
          <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card">
            <div className="h-[3px] gradient-mono-3" />
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-3">
                {t('urgentTitle')}
              </p>
              <div className="space-y-1.5">
              {urgentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/${slug}/${task.project.id}`}
                  className="flex items-center gap-3 border border-border rounded-lg px-4 py-2.5 bg-background/50 hover:border-primary/40 hover:bg-accent/30 transition-all"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.project.color
                        ? (COLOR_DOT_CLASS[task.project.color] ?? 'dot-indigo')
                        : 'bg-primary'
                    }`}
                  />
                  <span className="text-sm font-medium flex-1 truncate">{task.title}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${PRIORITY_COLORS[task.priority as Priority]}`}>
                    {tt(`priority.${task.priority}`)}
                  </span>
                  {task.dueDate ? (
                    <span className="hidden sm:inline text-xs text-muted-foreground shrink-0 tabular-nums">
                      {new Date(task.dueDate).toLocaleDateString(APP_LOCALE)}
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">{t('noDueDate')}</span>
                  )}
                </Link>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects grid */}
        <div className="space-y-3">
          {projects.length > 0 && (
            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
              {t('allProjectsTitle')}
            </p>
          )}

          {projects.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
              <div className="relative bg-dot-grid p-16 text-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 bg-primary rounded-full opacity-[0.04] blur-3xl" />
                </div>
                <div className="relative space-y-2">
                  <p className="text-base font-semibold">{t('noProjects')}</p>
                  <p className="text-sm text-muted-foreground">{t('noProjectsDescription')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project, i) => (
                <div key={project.id} className={`card-enter card-enter-${Math.min(i + 1, 6)}`}>
                  <ProjectCard project={project} workspaceSlug={slug} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone — owner only */}
        {role === WorkspaceRole.OWNER && (
          <DeleteWorkspaceButton workspaceId={workspace.id} />
        )}

      </div>
    </div>
  )
}

// ─── Health score class helpers ───────────────────────────────────────────────

function getHealthScoreClasses(score: number) {
  if (score >= 75) return {
    text: 'text-status-success',
    badge: 'bg-status-success-bg text-status-success',
    strip: 'gradient-mono-1',
  }
  if (score >= 50) return {
    text: 'text-status-warning',
    badge: 'bg-status-warning-bg text-status-warning',
    strip: 'gradient-mono-2',
  }
  if (score >= 25) return {
    text: 'text-orange-500',
    badge: 'bg-orange-500/10 text-orange-500',
    strip: 'gradient-mono-3',
  }
  return {
    text: 'text-status-danger',
    badge: 'bg-status-danger-bg text-status-danger',
    strip: 'gradient-mono-3',
  }
}

function healthScoreLabel(score: number, t: (key: string) => string) {
  if (score >= 75) return t('excellent')
  if (score >= 50) return t('good')
  if (score >= 25) return t('atRisk')
  return t('critical')
}

// ─── Bloomberg-style metric card ─────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  textClass,
  borderClass,
}: {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  textClass: string
  borderClass: string
}) {
  return (
    <div className={`border-l-4 ${borderClass} rounded-xl bg-card p-4 space-y-2 shadow-card border border-border`}>
      <div className={`flex items-center gap-1.5 ${textClass} opacity-60`}>
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-widest leading-none">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tabular-nums leading-none ${textClass}`}>{value}</span>
        {sub && (
          <span className="text-sm text-muted-foreground font-medium tabular-nums">{sub}</span>
        )}
      </div>
    </div>
  )
}
