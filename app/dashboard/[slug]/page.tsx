import { getWorkspaceAction } from '@/server/actions/workspace.actions'
import { projectRepository } from '@/server/repositories/project.repository'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface WorkspacePageProps {
  params: Promise<{ slug: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params
  const result = await getWorkspaceAction(slug)
  if (!result) notFound()

  const { workspace } = result
  const projects = await projectRepository.findByWorkspace(workspace.id)

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {workspace.members.length} miembro{workspace.members.length !== 1 ? 's' : ''} ·{' '}
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Sin proyectos aún</p>
            <p className="text-sm">Los proyectos aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${slug}/${project.id}`}
                className="block border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all bg-card group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {project._count.tasks} tarea{project._count.tasks !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
