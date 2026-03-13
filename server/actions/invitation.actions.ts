'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/server/lib/auth'
import * as invitationService from '@/server/services/invitation.service'

export async function sendInvitationAction(workspaceId: string, email: string) {
  const userId = await requireAuth()
  await invitationService.sendInvitation(workspaceId, userId, email)
  revalidatePath('/dashboard', 'layout')
}
