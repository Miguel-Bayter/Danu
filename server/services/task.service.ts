import { taskRepository } from '@/server/repositories/task.repository'
import { projectRepository } from '@/server/repositories/project.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { TaskStatus, Priority, WorkspaceRole } from '@prisma/client'

async function assertProjectMember(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId)
  if (!project) throw new Error('errors.notFound')
  const member = await workspaceRepository.getMember(project.workspaceId, userId)
  if (!member) throw new Error('errors.notMember')
  return { project, member }
}

async function assertCanEdit(projectId: string, userId: string) {
  const { project, member } = await assertProjectMember(projectId, userId)
  const canEdit: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]
  if (!canEdit.includes(member.role)) throw new Error('errors.insufficientPermissions')
  return { project, member }
}

export async function createTask(
  projectId: string,
  creatorId: string,
  data: {
    title: string
    description?: string
    status?: TaskStatus
    priority?: Priority
    assigneeId?: string
    parentId?: string
    dueDate?: Date
  },
) {
  await assertCanEdit(projectId, creatorId)
  if (!data.title || data.title.trim().length < 1) throw new Error('errors.nameTooShort')
  // Allow past due dates — valid for importing backlog or capturing overdue items
  const status = data.status ?? TaskStatus.TODO
  const position = await taskRepository.getNextPosition(projectId, status)
  return taskRepository.create({
    projectId,
    creatorId,
    ...data,
    title: data.title.trim(),
    status,
    position,
  })
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: {
    title?: string
    description?: string
    status?: TaskStatus
    priority?: Priority
    assigneeId?: string | null
    dueDate?: Date | null
  },
) {
  const task = await taskRepository.findById(taskId)
  if (!task) throw new Error('errors.notFound')
  await assertCanEdit(task.projectId, userId)
  if (data.title !== undefined && data.title.trim().length < 1) throw new Error('errors.nameTooShort')

  const updateData: Parameters<typeof taskRepository.update>[1] = {
    ...data,
    title: data.title?.trim(),
  }

  // If status changed to DONE, set completedAt
  if (data.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
    updateData.completedAt = new Date()
  } else if (data.status && data.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
    updateData.completedAt = null
  }

  return taskRepository.update(taskId, updateData)
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await taskRepository.findById(taskId)
  if (!task) throw new Error('errors.notFound')
  await assertCanEdit(task.projectId, userId)
  return taskRepository.delete(taskId)
}

export async function getTask(taskId: string, userId: string) {
  const task = await taskRepository.findById(taskId)
  if (!task) return null
  await assertProjectMember(task.projectId, userId)
  return task
}

export async function getTasks(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId)
  return taskRepository.findByProject(projectId)
}

// ─── Workspace-level queries (called by pages and actions) ─────────────────────

export function getWorkspaceMetrics(workspaceId: string) {
  return taskRepository.getWorkspaceMetrics(workspaceId)
}

/**
 * Calculates the Team Health Score from raw task counts.
 * Formula: completionRate% - overduePenalty%  (clamped 0–100)
 * Business logic lives here, not in the repository.
 */
export async function getWorkspaceHealthScore(workspaceId: string) {
  const { total, done, overdue } = await taskRepository.getWorkspaceMetrics(workspaceId)
  if (total === 0) return null
  const completionRate  = (done   / total) * 100
  const overduePenalty  = (overdue / total) * 30
  const score = Math.round(Math.max(0, Math.min(100, completionRate - overduePenalty)))
  return { score, total, done, overdue }
}

export function getUrgentTasks(workspaceId: string, limit = 5) {
  return taskRepository.findUrgentByWorkspace(workspaceId, limit)
}

export async function getWeeklyReportData(workspaceId: string) {
  const [metrics, healthScore, completedThisWeek, overdue] = await Promise.all([
    getWorkspaceMetrics(workspaceId),
    getWorkspaceHealthScore(workspaceId),
    taskRepository.findCompletedThisWeek(workspaceId),
    taskRepository.findOverdueByWorkspace(workspaceId),
  ])
  return { metrics, healthScore, completedThisWeek, overdue }
}
