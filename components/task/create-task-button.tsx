'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createTaskAction } from '@/server/actions/task.actions'
import { Priority, TaskStatus } from '@prisma/client'

interface Member {
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface CreateTaskButtonProps {
  projectId: string
  workspaceSlug: string
  members: Member[]
  defaultStatus?: TaskStatus
}

export function CreateTaskButton({
  projectId,
  workspaceSlug,
  members,
  defaultStatus = TaskStatus.TODO,
}: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('task')

  async function handleSubmit(formData: FormData) {
    setError('')
    setLoading(true)
    try {
      await createTaskAction(projectId, workspaceSlug, formData)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2 text-sm text-muted-foreground border border-dashed rounded-lg hover:border-primary/50 hover:text-foreground transition-colors text-left"
      >
        + {t('newButton').replace('+ ', '')}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">{t('createTitle')}</h2>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="status" value={defaultStatus} />

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('titleLabel')}</label>
            <input
              name="title"
              required
              autoFocus
              placeholder={t('titlePlaceholder')}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('descriptionLabel')}</label>
            <textarea
              name="description"
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('priorityLabel')}</label>
              <select
                name="priority"
                defaultValue={Priority.MEDIUM}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.values(Priority).map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('dueDateLabel')}</label>
              <input
                name="dueDate"
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Assignee */}
          {members.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('assigneeLabel')}</label>
              <select
                name="assigneeId"
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
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              {t('cancelButton')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : t('createButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
