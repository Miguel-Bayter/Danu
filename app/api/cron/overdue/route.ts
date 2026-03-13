import { NextRequest, NextResponse } from 'next/server'
import { taskRepository } from '@/server/repositories/task.repository'
import { notificationRepository } from '@/server/repositories/notification.repository'
import { NotificationType } from '@prisma/client'

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
  let processed = 0

  for (const task of tasks) {
    if (!task.assigneeId) continue
    await notificationRepository.create({
      userId: task.assigneeId,
      type: NotificationType.TASK_OVERDUE,
      title: 'notification.taskOverdue',
      body: task.title,
      linkUrl: `/dashboard/${task.project.workspace.slug}/${task.projectId}`,
    })
    processed++
  }

  return NextResponse.json({ processed, total: tasks.length })
}
