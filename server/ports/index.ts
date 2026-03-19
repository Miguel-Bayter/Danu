/**
 * Hexagonal Architecture — Port Interfaces
 *
 * Ports define the contracts between the application core (services) and the
 * infrastructure (repositories, external services). Concrete adapters live in
 * server/repositories/ and satisfy these interfaces via TypeScript structural
 * typing — no explicit `implements` keyword is required.
 *
 * Rule: services depend on these interfaces, never on concrete repository files.
 */

import type { TaskStatus, Priority, ProjectStatus, NotificationType } from '@prisma/client'

// ─── Value Objects ─────────────────────────────────────────────────────────────

export interface WorkspaceMetrics {
  total: number
  done: number
  overdue: number
  activeProjects: number
}

export interface HealthScoreResult {
  score: number
  total: number
  done: number
  overdue: number
}

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  body?: string
  linkUrl?: string
}

// ─── Task Repository Port ──────────────────────────────────────────────────────

export interface ITaskRepository {
  findById(id: string): Promise<unknown>
  findByProject(projectId: string): Promise<unknown[]>
  findByStatus(projectId: string, status: TaskStatus): Promise<unknown[]>
  findOverdue(): Promise<unknown[]>
  findDueSoon(hoursAhead?: number): Promise<unknown[]>
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
  }): Promise<unknown>
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
  ): Promise<unknown>
  updatePositions(tasks: { id: string; position: number; status: TaskStatus }[]): Promise<unknown>
  delete(id: string): Promise<unknown>
  getNextPosition(projectId: string, status: TaskStatus): Promise<number>
  getWorkspaceMetrics(workspaceId: string): Promise<WorkspaceMetrics>
  findCompletedThisWeek(workspaceId: string): Promise<unknown[]>
  findByWorkspaceTimeline(workspaceId: string): Promise<unknown[]>
  findOverdueByWorkspace(workspaceId: string): Promise<unknown[]>
  findUrgentByWorkspace(workspaceId: string, limit?: number): Promise<unknown[]>
}

// ─── Project Repository Port ───────────────────────────────────────────────────

export interface IProjectRepository {
  findById(id: string): Promise<unknown>
  findByWorkspace(workspaceId: string): Promise<unknown[]>
  create(data: {
    workspaceId: string
    name: string
    description?: string
    color?: string
    startDate?: Date
    endDate?: Date
  }): Promise<unknown>
  update(
    id: string,
    data: {
      name?: string
      description?: string
      status?: ProjectStatus
      color?: string
      startDate?: Date | null
      endDate?: Date | null
    },
  ): Promise<unknown>
  delete(id: string): Promise<unknown>
}

// ─── Notification Repository Port ──────────────────────────────────────────────

export interface INotificationRepository {
  findByUser(userId: string, limit?: number): Promise<unknown[]>
  countUnread(userId: string): Promise<number>
  create(data: NotificationPayload): Promise<unknown>
  markRead(id: string, userId: string): Promise<unknown>
  markAllRead(userId: string): Promise<unknown>
  deleteOne(id: string, userId: string): Promise<unknown>
}
