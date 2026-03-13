import Link from 'next/link'
import type { Workspace } from '@prisma/client'

type WorkspaceWithCount = Workspace & { _count: { projects: number } }

interface WorkspaceCardProps {
  workspace: WorkspaceWithCount
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      href={`/dashboard/${workspace.slug}`}
      className="block border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all bg-card group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {workspace.name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate group-hover:text-primary transition-colors">
            {workspace.name}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workspace._count.projects} proyecto{workspace._count.projects !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}
