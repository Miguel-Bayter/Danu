import { prisma } from '@/lib/prisma'
import { WorkspaceRole } from '@prisma/client'

export const workspaceRepository = {
  findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    })
  },

  findBySlug(slug: string) {
    return prisma.workspace.findUnique({
      where: { slug },
      include: { members: { include: { user: true } } },
    })
  },

  findByUser(userId: string) {
    return prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { members: true, _count: { select: { projects: true } } },
      orderBy: { createdAt: 'asc' },
    })
  },

  create(data: { name: string; slug: string; ownerId: string; logo?: string }) {
    return prisma.workspace.create({
      data: {
        ...data,
        members: {
          create: { userId: data.ownerId, role: WorkspaceRole.OWNER },
        },
      },
    })
  },

  update(id: string, data: { name?: string; logo?: string }) {
    return prisma.workspace.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.workspace.delete({ where: { id } })
  },

  getMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
  },

  addMember(workspaceId: string, userId: string, role: WorkspaceRole = WorkspaceRole.MEMBER) {
    return prisma.workspaceMember.create({ data: { workspaceId, userId, role } })
  },

  removeMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
  },

  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    return prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    })
  },
}
