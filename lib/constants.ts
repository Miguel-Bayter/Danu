import { Priority, TaskStatus } from '@prisma/client'

export const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

/** Maps project hex color → CSS strip class (defined in globals.css) */
export const COLOR_STRIP_CLASS: Record<string, string> = {
  '#6366f1': 'strip-indigo',
  '#8b5cf6': 'strip-violet',
  '#ec4899': 'strip-pink',
  '#ef4444': 'strip-red',
  '#f97316': 'strip-orange',
  '#eab308': 'strip-yellow',
  '#22c55e': 'strip-green',
  '#14b8a6': 'strip-teal',
  '#3b82f6': 'strip-blue',
  '#06b6d4': 'strip-cyan',
}

/** Maps project hex color → CSS left-border-color class (defined in globals.css) */
export const COLOR_ACCENT_CLASS: Record<string, string> = {
  '#6366f1': 'accent-l-indigo',
  '#8b5cf6': 'accent-l-violet',
  '#ec4899': 'accent-l-pink',
  '#ef4444': 'accent-l-red',
  '#f97316': 'accent-l-orange',
  '#eab308': 'accent-l-yellow',
  '#22c55e': 'accent-l-green',
  '#14b8a6': 'accent-l-teal',
  '#3b82f6': 'accent-l-blue',
  '#06b6d4': 'accent-l-cyan',
}

/** Maps project hex color → CSS dot class (for small color indicators) */
export const COLOR_DOT_CLASS: Record<string, string> = {
  '#6366f1': 'dot-indigo',
  '#8b5cf6': 'dot-violet',
  '#ec4899': 'dot-pink',
  '#ef4444': 'dot-red',
  '#f97316': 'dot-orange',
  '#eab308': 'dot-yellow',
  '#22c55e': 'dot-green',
  '#14b8a6': 'dot-teal',
  '#3b82f6': 'dot-blue',
  '#06b6d4': 'dot-cyan',
}

/** 5 gradient CSS classes — hash workspace/project name to pick one */
export const GRADIENT_CLASSES = [
  'gradient-mono-0',
  'gradient-mono-1',
  'gradient-mono-2',
  'gradient-mono-3',
  'gradient-mono-4',
] as const

export function getGradientClass(name: string): string {
  return GRADIENT_CLASSES[name.charCodeAt(0) % GRADIENT_CLASSES.length]
}

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
