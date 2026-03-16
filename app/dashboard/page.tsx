import { getUserWorkspacesAction } from '@/server/actions/workspace.actions'
import { maybeSeeDemoAction } from '@/server/actions/demo-seed.actions'
import { CreateWorkspaceButton } from '@/components/workspace/create-workspace-button'
import { WorkspaceCard } from '@/components/workspace/workspace-card'
import { getTranslations } from 'next-intl/server'
import { LogoMark } from '@/components/ui/logo-mark'

export default async function DashboardPage() {
  await maybeSeeDemoAction()
  const workspaces = await getUserWorkspacesAction()
  const t = await getTranslations('dashboard')

  return (
    <div className="p-5 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page header — gradient-brand fill */}
        <div className="rounded-2xl border border-border overflow-hidden shadow-card">
          <div className="gradient-brand px-6 py-5 flex items-center justify-between gap-4 relative">
            <div className="absolute inset-0 bg-white/[0.06] pointer-events-none" />
            <div className="relative">
              <h1 className="text-xl font-bold text-white tracking-tight">{t('title')}</h1>
              <p className="text-white/60 text-sm mt-0.5">
                {workspaces.length === 0
                  ? t('subtitleEmpty')
                  : `${workspaces.length} workspace${workspaces.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="relative">
              <CreateWorkspaceButton />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {workspaces.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="relative bg-dot-grid py-20 px-8 flex flex-col items-center text-center gap-5">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 bg-primary rounded-full opacity-[0.04] blur-3xl" />
              </div>
              <div className="relative">
                <LogoMark size="lg" className="mx-auto shadow-glow-brand" />
              </div>
              <div className="relative space-y-1.5 max-w-xs">
                <p className="text-base font-semibold">{t('emptyTitle')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('emptyDescription')}</p>
              </div>
              <div className="relative">
                <CreateWorkspaceButton />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspaces.map((ws, i) => (
              <div key={ws.id} className={`card-enter card-enter-${Math.min(i + 1, 6)}`}>
                <WorkspaceCard workspace={ws} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
