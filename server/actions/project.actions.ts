'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ProjectStatus, NotificationType } from '@prisma/client'
import * as projectService from '@/server/services/project.service'
import { requireAuth } from '@/server/lib/auth'
import { notificationRepository } from '@/server/repositories/notification.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'

export async function createProjectAction(workspaceId: string, workspaceSlug: string, formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || undefined
  const color = (formData.get('color') as string) || '#6366f1'
  const startDateRaw = formData.get('startDate') as string
  const endDateRaw = formData.get('endDate') as string

  await projectService.createProject(workspaceId, userId, {
    name,
    description,
    color,
    startDate: startDateRaw ? new Date(startDateRaw) : undefined,
    endDate: endDateRaw ? new Date(endDateRaw) : undefined,
  })

  // Notify OTHER workspace members only (not the creator — toast confirms to them)
  try {
    const workspace = await workspaceRepository.findById(workspaceId)
    if (workspace) {
      const others = workspace.members.filter((m) => m.userId !== userId)
      await Promise.all(
        others.map((m) =>
          notificationRepository.create({
            userId: m.userId,
            type: NotificationType.PROJECT_CREATED,
            title: 'notification.projectCreated',
            body: name,
            linkUrl: `/dashboard/${workspaceSlug}`,
          }),
        ),
      )
    }
  } catch { /* notifications are non-critical */ }

  revalidatePath(`/dashboard/${workspaceSlug}`)
}

export async function updateProjectAction(
  projectId: string,
  workspaceSlug: string,
  formData: FormData,
) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || undefined
  const color = (formData.get('color') as string) || undefined
  const status = (formData.get('status') as ProjectStatus) || undefined
  const startDateRaw = formData.get('startDate') as string
  const endDateRaw = formData.get('endDate') as string

  await projectService.updateProject(projectId, userId, {
    name,
    description,
    color,
    status,
    startDate: startDateRaw ? new Date(startDateRaw) : null,
    endDate: endDateRaw ? new Date(endDateRaw) : null,
  })

  revalidatePath(`/dashboard/${workspaceSlug}`)
}

export async function deleteProjectAction(
  projectId: string,
  workspaceSlug: string,
) {
  const userId = await requireAuth()

  // Notify OTHER workspace members before deleting (not the one who deleted — toast confirms)
  try {
    const workspace = await workspaceRepository.findBySlug(workspaceSlug)
    if (workspace) {
      const project = await projectService.getProject(projectId, userId)
      const projectName = project?.name ?? ''
      const others = workspace.members.filter((m) => m.userId !== userId)
      await Promise.all(
        others.map((m) =>
          notificationRepository.create({
            userId: m.userId,
            type: NotificationType.PROJECT_DELETED,
            title: 'notification.projectDeleted',
            body: projectName,
            linkUrl: `/dashboard/${workspaceSlug}`,
          }),
        ),
      )
    }
  } catch { /* notifications are non-critical */ }

  await projectService.deleteProject(projectId, userId)
  revalidatePath(`/dashboard/${workspaceSlug}`)
  redirect(`/dashboard/${workspaceSlug}`)
}

export async function getProjectAction(projectId: string) {
  const userId = await requireAuth()
  return projectService.getProject(projectId, userId)
}
