'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { updateProjectAction, deleteProjectAction } from '@/server/actions/project.actions'
import { COLOR_OPTIONS } from '@/lib/constants'

interface SettingsPageProps {
  params: Promise<{ slug: string; projectId: string }>
}

export default function ProjectSettingsPage({ params }: SettingsPageProps) {
  const { slug, projectId } = use(params)
  const router = useRouter()
  const t = useTranslations('project')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpdate(formData: FormData) {
    setError('')
    setLoading(true)
    formData.set('color', color)
    try {
      await updateProjectAction(projectId, slug, formData)
      router.push(`/dashboard/${slug}/${projectId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setError('')
    setLoading(true)
    try {
      await deleteProjectAction(projectId, slug)
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e // re-throw Next.js redirect
      setError(e instanceof Error ? e.message : 'Error')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t('editTitle')}</h1>
        </div>

        <form action={handleUpdate} className="space-y-4 border rounded-xl p-6 bg-card">
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('descriptionLabel')}</label>
            <textarea
              name="description"
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('startDateLabel')}</label>
              <input
                name="startDate"
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('endDateLabel')}</label>
              <input
                name="endDate"
                type="date"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
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

        {/* Danger zone */}
        <div className="border border-red-200 dark:border-red-900 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-red-600">{t('dangerZone')}</h2>
          <p className="text-sm text-muted-foreground">{t('deleteConfirm')}</p>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {t('deleteButton')}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <p className="font-medium">{t('deleteConfirm')}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
              >
                {t('cancelButton')}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : t('deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
