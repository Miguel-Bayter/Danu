'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { WorkspaceRole } from '@prisma/client'
import * as workspaceService from '@/server/services/workspace.service'

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  return session.user.id
}

export async function createWorkspaceAction(formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const workspace = await workspaceService.createWorkspace(userId, name)
  revalidatePath('/dashboard')
  redirect(`/dashboard/${workspace.slug}`)
}

export async function updateWorkspaceAction(workspaceId: string, formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  await workspaceService.updateWorkspace(workspaceId, userId, name)
  revalidatePath('/dashboard')
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const userId = await requireAuth()
  await workspaceService.deleteWorkspace(workspaceId, userId)
  revalidatePath('/dashboard')
  redirect('/dashboard')
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
