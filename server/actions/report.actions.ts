'use server'

import { requireAuth } from '@/server/lib/auth'
import { taskRepository } from '@/server/repositories/task.repository'

export async function getWeeklyReportDataAction(workspaceId: string) {
  await requireAuth()
  const [metrics, healthScore, completedThisWeek, overdue] = await Promise.all([
    taskRepository.getWorkspaceMetrics(workspaceId),
    taskRepository.getHealthScore(workspaceId),
    taskRepository.findCompletedThisWeek(workspaceId),
    taskRepository.findOverdueByWorkspace(workspaceId),
  ])
  return { metrics, healthScore, completedThisWeek, overdue }
}
