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
      include: {
        assignee: true,
        project: { include: { workspace: { select: { slug: true } } } },
      },
    })
  },

  findDueSoon(hoursAhead = 24) {
    const now = new Date()
    const limit = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
    return prisma.task.findMany({
      where: { dueDate: { gte: now, lte: limit }, status: { not: TaskStatus.DONE } },
      include: {
        assignee: true,
        project: { include: { workspace: { select: { slug: true } } } },
      },
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

  async getWorkspaceMetrics(workspaceId: string) {
    const now = new Date()
    const projectIds = await prisma.project
      .findMany({ where: { workspaceId }, select: { id: true } })
      .then((ps) => ps.map((p) => p.id))

    if (projectIds.length === 0) {
      return { total: 0, done: 0, overdue: 0, activeProjects: 0 }
    }

    const baseWhere = { projectId: { in: projectIds }, parentId: null }

    const [total, done, overdue, activeProjects] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.DONE } }),
      prisma.task.count({
        where: { ...baseWhere, dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
      }),
      prisma.project.count({
        where: {
          workspaceId,
          tasks: { some: { status: { not: TaskStatus.DONE }, parentId: null } },
        },
      }),
    ])

    return { total, done, overdue, activeProjects }
  },

  async getHealthScore(workspaceId: string) {
    const projectIds = await prisma.project
      .findMany({ where: { workspaceId }, select: { id: true } })
      .then((ps) => ps.map((p) => p.id))

    if (projectIds.length === 0) return null

    const baseWhere = { projectId: { in: projectIds }, parentId: null }
    const now = new Date()

    const [total, done, overdue] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: TaskStatus.DONE } }),
      prisma.task.count({
        where: { ...baseWhere, dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
      }),
    ])

    if (total === 0) return null

    const completionRate = (done / total) * 100
    const overduePenalty = (overdue / total) * 30
    const score = Math.round(Math.max(0, Math.min(100, completionRate - overduePenalty)))

    return { score, total, done, overdue }
  },

  findCompletedThisWeek(workspaceId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return prisma.task.findMany({
      where: {
        project: { workspaceId },
        completedAt: { gte: sevenDaysAgo },
        parentId: null,
      },
      include: { assignee: true, project: { select: { name: true, color: true } } },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })
  },

  findByWorkspaceTimeline(workspaceId: string) {
    return prisma.task.findMany({
      where: {
        project: { workspaceId },
        dueDate: { not: null },
        parentId: null,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        project:  { select: { id: true, name: true, color: true, status: true } },
        _count:   { select: { subtasks: true } },
      },
      orderBy: [{ projectId: 'asc' }, { dueDate: 'asc' }],
    })
  },

  findOverdueByWorkspace(workspaceId: string) {
    return prisma.task.findMany({
      where: {
        project: { workspaceId },
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
        parentId: null,
      },
      include: { assignee: true, project: { select: { name: true, color: true } } },
      orderBy: { dueDate: 'asc' },
      take: 20,
    })
  },

  findUrgentByWorkspace(workspaceId: string, limit = 5) {
    return prisma.task.findMany({
      where: {
        project: { workspaceId },
        priority: { in: [Priority.URGENT, Priority.HIGH] },
        status: { not: TaskStatus.DONE },
        parentId: null,
      },
      include: { assignee: true, project: { select: { id: true, name: true, color: true } } },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      take: limit,
    })
  },
}
