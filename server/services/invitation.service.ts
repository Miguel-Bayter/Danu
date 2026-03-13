import { invitationRepository } from '@/server/repositories/invitation.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { userRepository } from '@/server/repositories/user.repository'
import { assertMemberRole } from '@/server/services/workspace.service'
import { WorkspaceRole } from '@prisma/client'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { InvitationEmail } from '@/emails/invitation'

export async function sendInvitation(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
) {
  await assertMemberRole(workspaceId, invitedByUserId, WorkspaceRole.ADMIN)

  const workspace = await workspaceRepository.findById(workspaceId)
  if (!workspace) throw new Error('errors.notFound')

  const invitation = await invitationRepository.upsert(workspaceId, email, invitedByUserId)
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`

  const inviter = await userRepository.findById(invitedByUserId)
  const inviterName = inviter?.name ?? 'Un miembro del equipo'

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Danu <noreply@danu.app>',
    to: email,
    subject: `Invitación a ${workspace.name} en Danu`,
    html: await render(
      InvitationEmail({ inviterName, workspaceName: workspace.name, inviteUrl }),
    ),
  })

  return invitation
}

export async function acceptInvitation(token: string, userId: string, userEmail: string) {
  const invitation = await invitationRepository.findByToken(token)
  if (!invitation) throw new Error('invitation.invalidToken')
  if (invitation.expiresAt < new Date()) throw new Error('invitation.invalidToken')
  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('invitation.invalidToken')
  }

  const existing = await workspaceRepository.getMember(invitation.workspaceId, userId)
  if (!existing) {
    await workspaceRepository.addMember(invitation.workspaceId, userId, WorkspaceRole.MEMBER)
  }

  await invitationRepository.delete(invitation.id)

  return invitation.workspace
}
