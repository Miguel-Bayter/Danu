import { prisma } from '@/lib/prisma'
import { TaskStatus, Priority } from '@prisma/client'

export const taskRepository = {
  findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        creator: true,
        subtasks: { orderBy: { position: 'asc' } },
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
    })
  },

  findByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId, parentId: null },
      include: {
        assignee: true,
        subtasks: { orderBy: { position: 'asc' } },
        _count: { select: { comments: true } },
      },
      orderBy: { position: 'asc' },
    })
  },

  findByStatus(projectId: string, status: TaskStatus) {
    return prisma.task.findMany({
      where: { projectId, status, parentId: null },
      include: { assignee: true, _count: { select: { subtasks: true } } },
      orderBy: { position: 'asc' },
    })
  },

  findOverdue() {
    return prisma.task.findMany({
      where: { dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
      include: { assignee: true, project: true },
    })
  },

  findDueSoon(hoursAhead = 24) {
    const now = new Date()
    const limit = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
    return prisma.task.findMany({
      where: { dueDate: { gte: now, lte: limit }, status: { not: TaskStatus.DONE } },
      include: { assignee: true, project: true },
    })
  },

  create(data: {
    projectId: string
    creatorId: string
    title: string
    description?: string
    status?: TaskStatus
    priority?: Priority
    assigneeId?: string
    parentId?: string
    dueDate?: Date
    position?: number
  }) {
    return prisma.task.create({ data })
  },

  update(
    id: string,
    data: {
      title?: string
      description?: string
      status?: TaskStatus
      priority?: Priority
      assigneeId?: string | null
      dueDate?: Date | null
      position?: number
      completedAt?: Date | null
    },
  ) {
    return prisma.task.update({ where: { id }, data })
  },

  updatePositions(tasks: { id: string; position: number; status: TaskStatus }[]) {
    return prisma.$transaction(
      tasks.map(({ id, position, status }) =>
        prisma.task.update({ where: { id }, data: { position, status } }),
      ),
    )
  },

  delete(id: string) {
    return prisma.task.delete({ where: { id } })
  },

  getNextPosition(projectId: string, status: TaskStatus) {
    return prisma.task
      .aggregate({ where: { projectId, status }, _max: { position: true } })
      .then((r) => (r._max.position ?? -1) + 1)
  },
}
