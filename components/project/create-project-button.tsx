'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createProjectAction } from '@/server/actions/project.actions'
import { COLOR_OPTIONS } from '@/lib/constants'

interface CreateProjectButtonProps {
  workspaceId: string
  workspaceSlug: string
}

export function CreateProjectButton({ workspaceId, workspaceSlug }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('project')
  const te = useTranslations('errors')

  const today = new Date().toISOString().split('T')[0]

  function toastError(e: unknown) {
    const msg = e instanceof Error ? e.message : 'generic'
    const key = msg.startsWith('errors.') ? msg.slice(7) : 'generic'
    toast.error(te(key))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set('color', color)
    try {
      await createProjectAction(workspaceId, workspaceSlug, formData)
      setOpen(false)
      toast.success(t('createSuccess'))
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e
      toastError(e)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {t('newButton')}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">{t('createTitle')}</h2>
        <form action={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('nameLabel')}</label>
            <input
              name="name"
              required
              minLength={2}
              placeholder={t('namePlaceholder')}
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

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('colorLabel')}</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('startDateLabel')}</label>
              <input
                name="startDate"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('endDateLabel')}</label>
              <input
                name="endDate"
                type="date"
                min={startDate || today}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

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
