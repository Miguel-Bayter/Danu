import { invitationRepository } from '@/server/repositories/invitation.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { WorkspaceRole } from '@prisma/client'

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
}

async function requireMinRole(workspaceId: string, userId: string, minRole: WorkspaceRole) {
  const member = await workspaceRepository.getMember(workspaceId, userId)
  if (!member) throw new Error('errors.notMember')
  if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minRole]) {
    throw new Error('errors.insufficientPermissions')
  }
}

export async function generateInviteLink(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
) {
  await requireMinRole(workspaceId, invitedByUserId, WorkspaceRole.ADMIN)

  const workspace = await workspaceRepository.findById(workspaceId)
  if (!workspace) throw new Error('errors.notFound')

  const invitation = await invitationRepository.upsert(workspaceId, email, invitedByUserId)
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`

  return { inviteUrl }
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await invitationRepository.findByToken(token)
  if (!invitation) throw new Error('invitation.invalidToken')
  if (invitation.expiresAt < new Date()) throw new Error('invitation.invalidToken')

  const existing = await workspaceRepository.getMember(invitation.workspaceId, userId)
  if (!existing) {
    await workspaceRepository.addMember(invitation.workspaceId, userId, WorkspaceRole.MEMBER)
  }

  await invitationRepository.delete(invitation.id)

  return invitation.workspace
}
