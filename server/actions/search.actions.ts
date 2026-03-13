'use server'

import { requireAuth } from '@/server/lib/auth'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { projectRepository } from '@/server/repositories/project.repository'

export async function getSearchDataAction() {
  const userId = await requireAuth()
  const workspaces = await workspaceRepository.findByUser(userId)

  const projectsByWorkspace = await Promise.all(
    workspaces.map(async (ws) => {
      const projects = await projectRepository.findByWorkspace(ws.id)
      return projects.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        workspaceId: ws.id,
        workspaceSlug: ws.slug,
        workspaceName: ws.name,
      }))
    }),
  )

  return {
    workspaces: workspaces.map((ws) => ({ id: ws.id, name: ws.name, slug: ws.slug })),
    projects: projectsByWorkspace.flat(),
  }
}
