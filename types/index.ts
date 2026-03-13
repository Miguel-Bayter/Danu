// ─── Enums (espejados de Prisma para uso en el cliente) ────

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'DEADLINE_SOON'
  | 'TASK_OVERDUE'
  | 'MENTIONED'
  | 'PROJECT_UPDATE'
export type DependencyType = 'BLOCKS' | 'RELATES_TO'

// ─── Modelos base (para Client Components) ─────────────────

export interface User {
  id: string
  clerkId: string
  email: string
  name: string
  avatarUrl: string | null
  timezone: string
  createdAt: Date
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  ownerId: string
  createdAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: Role
  joinedAt: Date
  user?: User
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: { tasks: number }
}

export interface Task {
  id: string
  projectId: string
  assigneeId: string | null
  createdById: string
  parentTaskId: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  startDate: Date | null
  dueDate: Date | null
  orderIndex: number
  createdAt: Date
  updatedAt: Date
  assignee?: User | null
  subtasks?: Task[]
  _count?: { subtasks: number; comments: number }
  blockedDependencies?: { blockingTaskId: string }[]
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: Date
}

// ─── Tipos de respuesta para Server Actions ────────────────

export type ActionResult<T = void> =
  | { data: T; error?: never }
  | { data?: never; error: string }

// ─── Health Score ──────────────────────────────────────────

export type HealthLabel = 'green' | 'yellow' | 'red'

export interface MemberHealth {
  userId: string
  user: User
  score: number
  label: HealthLabel
  taskBreakdown: {
    total: number
    urgent: number
    overdue: number
    high: number
  }
}
