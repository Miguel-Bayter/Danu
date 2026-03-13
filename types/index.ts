// ─── Enums (mirrored from Prisma for use in Client Components) ───

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'COMMENT_ADDED'
  | 'MEMBER_JOINED'
  | 'PROJECT_CREATED'

// ─── Base models (for Client Components) ─────────────────────

export interface User {
  id: string
  email: string | null
  name: string | null
  image: string | null
  timezone: string
  createdAt: Date
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo: string | null
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
  creatorId: string
  parentId: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  position: number
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignee?: User | null
  subtasks?: Task[]
  _count?: { subtasks: number; comments: number }
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: Date
  updatedAt: Date
  author?: User
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  linkUrl: string | null
  read: boolean
  createdAt: Date
}

// ─── Server Action response type ─────────────────────────────

export type ActionResult<T = void> =
  | { data: T; error?: never }
  | { data?: never; error: string }

// ─── Health Score ─────────────────────────────────────────────

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
