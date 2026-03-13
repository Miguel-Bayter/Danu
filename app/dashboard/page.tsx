import { getUserWorkspacesAction } from '@/server/actions/workspace.actions'
import { CreateWorkspaceButton } from '@/components/workspace/create-workspace-button'
import { WorkspaceCard } from '@/components/workspace/workspace-card'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const workspaces = await getUserWorkspacesAction()
  const t = await getTranslations('dashboard')

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {workspaces.length === 0
                ? t('subtitleEmpty')
                : `${workspaces.length} workspace${workspaces.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <CreateWorkspaceButton />
        </div>

        {workspaces.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">{t('emptyTitle')}</p>
            <p className="text-sm">{t('emptyDescription')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
