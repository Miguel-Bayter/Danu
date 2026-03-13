'use server'

import { revalidatePath } from 'next/cache'
import { TaskStatus, Priority, NotificationType } from '@prisma/client'
import * as taskService from '@/server/services/task.service'
import { requireAuth } from '@/server/lib/auth'
import { notificationRepository } from '@/server/repositories/notification.repository'
import { taskRepository } from '@/server/repositories/task.repository'

export async function createTaskAction(
  projectId: string,
  workspaceSlug: string,
  formData: FormData,
) {
  const userId = await requireAuth()
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || undefined
  const priority = (formData.get('priority') as Priority) || Priority.MEDIUM
  const status = (formData.get('status') as TaskStatus) || TaskStatus.TODO
  const assigneeId = (formData.get('assigneeId') as string) || undefined
  const dueDateRaw = formData.get('dueDate') as string
  const parentId = (formData.get('parentId') as string) || undefined

  const task = await taskService.createTask(projectId, userId, {
    title,
    description,
    priority,
    status,
    assigneeId,
    parentId,
    dueDate: dueDateRaw ? new Date(dueDateRaw) : undefined,
  })

  // Notify assignee if different from creator
  if (task.assigneeId && task.assigneeId !== userId) {
    await notificationRepository.create({
      userId: task.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'notification.taskAssigned',
      body: task.title,
      linkUrl: `/dashboard/${workspaceSlug}/${projectId}`,
    })
  }

  revalidatePath(`/dashboard/${workspaceSlug}/${projectId}`)
}

export async function updateTaskAction(
  taskId: string,
  projectId: string,
  workspaceSlug: string,
  formData: FormData,
) {
  const userId = await requireAuth()
  const title = (formData.get('title') as string) || undefined
  const description = formData.has('description')
    ? (formData.get('description') as string) || undefined
    : undefined
  const priority = (formData.get('priority') as Priority) || undefined
  const status = (formData.get('status') as TaskStatus) || undefined
  const assigneeId = formData.has('assigneeId')
    ? (formData.get('assigneeId') as string) || null
    : undefined
  const dueDateRaw = formData.get('dueDate') as string | null

  // Check old assignee before updating
  const oldTask = assigneeId !== undefined ? await taskRepository.findById(taskId) : null

  const task = await taskService.updateTask(taskId, userId, {
    title,
    description,
    priority,
    status,
    assigneeId,
    dueDate: dueDateRaw ? new Date(dueDateRaw) : dueDateRaw === '' ? null : undefined,
  })

  // Notify new assignee if changed and different from current user
  const newAssigneeId = task.assigneeId
  if (
    newAssigneeId &&
    newAssigneeId !== oldTask?.assigneeId &&
    newAssigneeId !== userId
  ) {
    await notificationRepository.create({
      userId: newAssigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'notification.taskAssigned',
      body: task.title,
      linkUrl: `/dashboard/${workspaceSlug}/${projectId}`,
    })
  }

  revalidatePath(`/dashboard/${workspaceSlug}/${projectId}`)
}

export async function deleteTaskAction(
  taskId: string,
  projectId: string,
  workspaceSlug: string,
) {
  const userId = await requireAuth()
  await taskService.deleteTask(taskId, userId)
  revalidatePath(`/dashboard/${workspaceSlug}/${projectId}`)
}

export async function getTaskAction(taskId: string) {
  const userId = await requireAuth()
  return taskService.getTask(taskId, userId)
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus,
  projectId: string,
  workspaceSlug: string,
) {
  const userId = await requireAuth()
  await taskService.updateTask(taskId, userId, { status })
  revalidatePath(`/dashboard/${workspaceSlug}/${projectId}`)
}
