'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateTaskAction, deleteTaskAction } from '@/server/actions/task.actions'
import { Priority, TaskStatus } from '@prisma/client'

interface Member {
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  assigneeId: string | null
  assignee: { id: string; name: string | null; image: string | null } | null
  subtasks: { id: string; title: string; status: TaskStatus }[]
  _count?: { comments: number }
}

interface TaskSheetProps {
  task: Task
  projectId: string
  workspaceSlug: string
  members: Member[]
  onClose: () => void
}

const PRIORITY_COLORS: Record<Priority, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  LOW: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export function TaskSheet({ task, projectId, workspaceSlug, members, onClose }: TaskSheetProps) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('task')

  async function handleUpdate(formData: FormData) {
    setError('')
    setLoading(true)
    try {
      await updateTaskAction(task.id, projectId, workspaceSlug, formData)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteTaskAction(task.id, projectId, workspaceSlug)
      onClose()
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e
      setError(e instanceof Error ? e.message : 'Error')
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <span className={`text-xs px-2 py-1 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {t(`priority.${task.priority}`)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
            >
              {t('deleteButton')}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form action={handleUpdate} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('titleLabel')}
              </label>
              <input
                name="title"
                required
                defaultValue={task.title}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('descriptionLabel')}
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task.description ?? ''}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('statusLabel')}
                </label>
                <select
                  name="status"
                  defaultValue={task.status}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.values(TaskStatus).map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('priorityLabel')}
                </label>
                <select
                  name="priority"
                  defaultValue={task.priority}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>
                      {t(`priority.${p}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('assigneeLabel')}
              </label>
              <select
                name="assigneeId"
                defaultValue={task.assigneeId ?? ''}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('unassigned')}</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name ?? m.userId}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('dueDateLabel')}
              </label>
              <input
                name="dueDate"
                type="date"
                defaultValue={formatDate(task.dueDate)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Subtasks summary */}
            {task.subtasks.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('subtasksLabel')} ({task.subtasks.filter((s) => s.status === TaskStatus.DONE).length}/{task.subtasks.length})
                </label>
                <div className="space-y-1.5">
                  {task.subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                          sub.status === TaskStatus.DONE
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      />
                      <span className={sub.status === TaskStatus.DONE ? 'line-through text-muted-foreground' : ''}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : t('saveButton')}
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <p className="font-medium">{t('deleteConfirm')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
              >
                {t('cancelButton')}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {t('deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
