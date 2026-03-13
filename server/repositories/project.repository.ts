import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

export const projectRepository = {
  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    })
  },

  findByWorkspace(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'asc' },
    })
  },

  create(data: {
    workspaceId: string
    name: string
    description?: string
    color?: string
    startDate?: Date
    endDate?: Date
  }) {
    return prisma.project.create({ data })
  },

  update(
    id: string,
    data: {
      name?: string
      description?: string
      status?: ProjectStatus
      color?: string
      startDate?: Date | null
      endDate?: Date | null
    },
  ) {
    return prisma.project.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.project.delete({ where: { id } })
  },
}
