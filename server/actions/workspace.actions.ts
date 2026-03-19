'use server'

import { revalidatePath } from 'next/cache'
import { WorkspaceRole } from '@prisma/client'
import * as workspaceService from '@/server/services/workspace.service'
import * as notificationService from '@/server/services/notification.service'
import { requireAuth } from '@/server/lib/auth'
import { workspaceRepository } from '@/server/repositories/workspace.repository'

export async function createWorkspaceAction(formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const workspace = await workspaceService.createWorkspace(userId, name)

  // No self-notification: the toast confirms the action to the creator.
  // Other members don't exist yet at workspace creation time.

  revalidatePath('/dashboard')
  return { slug: workspace.slug }
}

export async function updateWorkspaceAction(workspaceId: string, formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  await workspaceService.updateWorkspace(workspaceId, userId, name)
  revalidatePath('/dashboard')
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const userId = await requireAuth()

  try {
    const workspace = await workspaceRepository.findById(workspaceId)
    if (workspace) {
      await notificationService.notifyWorkspaceDeleted(
        workspace.members.map((m) => m.userId),
        userId,
        workspace.name,
      )
    }
  } catch { /* notifications are non-critical */ }

  await workspaceService.deleteWorkspace(workspaceId, userId)
  revalidatePath('/dashboard')
}

export async function removeMemberAction(workspaceId: string, targetUserId: string) {
  const userId = await requireAuth()
  await workspaceService.removeMember(workspaceId, userId, targetUserId)
  revalidatePath('/dashboard')
}

export async function updateMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  role: WorkspaceRole,
) {
  const userId = await requireAuth()
  await workspaceService.updateMemberRole(workspaceId, userId, targetUserId, role)
  revalidatePath('/dashboard')
}

export async function getUserWorkspacesAction() {
  const userId = await requireAuth()
  return workspaceService.getUserWorkspaces(userId)
}

export async function getWorkspaceAction(slug: string) {
  const userId = await requireAuth()
  return workspaceService.getWorkspace(slug, userId)
}
