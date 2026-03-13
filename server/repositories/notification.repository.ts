import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export const notificationRepository = {
  findByUser(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } })
  },

  create(data: {
    userId: string
    type: NotificationType
    title: string
    body?: string
    linkUrl?: string
  }) {
    return prisma.notification.create({ data })
  },

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    })
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
  },

  deleteOne(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } })
  },
}
