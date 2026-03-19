'use server'

import { requireAuth } from '@/server/lib/auth'
import * as taskService from '@/server/services/task.service'

export async function getWeeklyReportDataAction(workspaceId: string) {
  await requireAuth()
  return taskService.getWeeklyReportData(workspaceId)
}
