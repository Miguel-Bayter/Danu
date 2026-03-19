/**
 * Notification Service
 *
 * Encapsulates all notification-creation logic so that actions never call
 * the notification repository directly. This keeps the domain rules in one
 * place (e.g. "never notify the actor themselves") and satisfies the
 * Layered Architecture constraint: Actions → Services → Repositories.
 */

import { notificationRepository } from '@/server/repositories/notification.repository'
import { NotificationType } from '@prisma/client'

/** Notify a user they were assigned to a task. No-op when actor === assignee. */
export async function notifyTaskAssigned(
  assigneeId: string,
  actorId: string,
  taskTitle: string,
  projectName: string | null,
  linkUrl: string,
) {
  if (assigneeId === actorId) return
  await notificationRepository.create({
    userId: assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: 'notification.taskAssigned',
    body: projectName ? `${taskTitle} · ${projectName}` : taskTitle,
    linkUrl,
  })
}

/** Notify workspace members that a project was created. Skips the actor. */
export async function notifyProjectCreated(
  memberIds: string[],
  actorId: string,
  projectName: string,
  linkUrl: string,
) {
  const others = memberIds.filter((id) => id !== actorId)
  await Promise.all(
    others.map((userId) =>
      notificationRepository.create({
        userId,
        type: NotificationType.PROJECT_CREATED,
        title: 'notification.projectCreated',
        body: projectName,
        linkUrl,
      }),
    ),
  )
}

/** Notify workspace members that a project was deleted. Skips the actor. */
export async function notifyProjectDeleted(
  memberIds: string[],
  actorId: string,
  projectName: string,
  linkUrl: string,
) {
  const others = memberIds.filter((id) => id !== actorId)
  await Promise.all(
    others.map((userId) =>
      notificationRepository.create({
        userId,
        type: NotificationType.PROJECT_DELETED,
        title: 'notification.projectDeleted',
        body: projectName,
        linkUrl,
      }),
    ),
  )
}

/** Notify workspace members their workspace was deleted. Skips the actor. */
export async function notifyWorkspaceDeleted(
  memberIds: string[],
  actorId: string,
  workspaceName: string,
) {
  const others = memberIds.filter((id) => id !== actorId)
  await Promise.all(
    others.map((userId) =>
      notificationRepository.create({
        userId,
        type: NotificationType.WORKSPACE_DELETED,
        title: 'notification.workspaceDeleted',
        body: workspaceName,
      }),
    ),
  )
}
