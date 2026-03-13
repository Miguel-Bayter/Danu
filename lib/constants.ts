import { Priority, TaskStatus } from '@prisma/client'

export const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

export const PRIORITY_COLORS: Record<Priority, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  LOW: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
]

export const APP_LOCALE = 'es'
