'use server'

import { NotificationType, WorkspaceRole } from '@prisma/client'
import { requireAuth } from '@/server/lib/auth'
import * as invitationService from '@/server/services/invitation.service'
import { notificationRepository } from '@/server/repositories/notification.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'

export async function generateInviteLinkAction(workspaceId: string, email: string) {
  const userId = await requireAuth()
  return invitationService.generateInviteLink(workspaceId, userId, email)
}

export async function acceptInvitationAction(token: string) {
  const userId = await requireAuth()
  const workspace = await invitationService.acceptInvitation(token, userId)

  // Notify workspace owner and admins that a new member joined
  const ws = await workspaceRepository.findById(workspace.id)
  if (ws) {
    const ownersAndAdmins = ws.members.filter(
      (m) =>
        (m.role === WorkspaceRole.OWNER || m.role === WorkspaceRole.ADMIN) &&
        m.userId !== userId,
    )
    await Promise.all(
      ownersAndAdmins.map((m) =>
        notificationRepository.create({
          userId: m.userId,
          type: NotificationType.MEMBER_JOINED,
          title: 'notification.memberJoined',
          body: workspace.name,
          linkUrl: `/dashboard/${workspace.slug}`,
        }),
      ),
    )
  }

  return workspace
}
