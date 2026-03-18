import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/server/repositories/task.repository'
import { notificationRepository } from '@/server/repositories/notification.repository'
import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const hasCronSecret =
    process.env.CRON_SECRET &&
    req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  if (process.env.NODE_ENV === 'production' && !isVercelCron && !hasCronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await taskRepository.findOverdue()
  const assignedTasks = tasks.filter((t) => t.assigneeId)

  await Promise.all(
    assignedTasks.map((task) =>
      notificationRepository.create({
        userId: task.assigneeId!,
        type: NotificationType.TASK_OVERDUE,
        title: 'notification.taskOverdue',
        body: task.title,
        linkUrl: `/dashboard/${task.project.workspace.slug}/${task.projectId}`,
      }),
    ),
  )

  const processed = assignedTasks.length

  // Cleanup orphaned demo users (tab closed without logout) older than 2h
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const { count: demosDeleted } = await prisma.user.deleteMany({
    where: {
      email: { startsWith: 'demo-', endsWith: '@danu.app' },
      createdAt: { lt: twoHoursAgo },
    },
  })

  return NextResponse.json({ processed, total: tasks.length, demosDeleted })
}
