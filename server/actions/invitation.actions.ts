'use server'

import { requireAuth } from '@/server/lib/auth'
import * as invitationService from '@/server/services/invitation.service'

export async function generateInviteLinkAction(workspaceId: string, email: string) {
  const userId = await requireAuth()
  return invitationService.generateInviteLink(workspaceId, userId, email)
}

export async function acceptInvitationAction(token: string) {
  const userId = await requireAuth()
  return invitationService.acceptInvitation(token, userId)
}
