import { prisma } from '@/lib/prisma'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const invitationRepository = {
  findByToken(token: string) {
    return prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    })
  },

  findByWorkspace(workspaceId: string) {
    return prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })
  },

  upsert(workspaceId: string, email: string, invitedById: string) {
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS)
    return prisma.workspaceInvitation.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      update: { expiresAt, invitedById },
      create: { workspaceId, email, invitedById, expiresAt },
    })
  },

  delete(id: string) {
    return prisma.workspaceInvitation.delete({ where: { id } })
  },
}
