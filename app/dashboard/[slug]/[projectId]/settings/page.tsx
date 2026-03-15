'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Settings2, Trash2, X } from 'lucide-react'
import { updateProjectAction, deleteProjectAction } from '@/server/actions/project.actions'
import { COLOR_OPTIONS, COLOR_STRIP_CLASS } from '@/lib/constants'

interface SettingsPageProps {
  params: Promise<{ slug: string; projectId: string }>
}

export default function ProjectSettingsPage({ params }: SettingsPageProps) {
  const { slug, projectId } = use(params)
  const router = useRouter()
  const t = useTranslations('project')
  const te = useTranslations('errors')

  const _d = new Date()
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`

  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dateError, setDateError] = useState('')

  function toastError(e: unknown) {
    const msg = e instanceof Error ? e.message : 'generic'
    const key = msg.startsWith('errors.') ? msg.slice(7) : 'generic'
    toast.error(te(key))
  }

  async function handleUpdate(formData: FormData) {
    setDateError('')
    const sd = formData.get('startDate') as string
    const ed = formData.get('endDate') as string

    if (sd && sd < today) { setDateError(t('startDatePast')); return }
    if (ed && ed < today) { setDateError(t('endDatePast')); return }
    if (sd && ed && ed < sd) { setDateError(te('endDateBeforeStart')); return }

    setLoading(true)
    formData.set('color', color)
    try {
      await updateProjectAction(projectId, slug, formData)
      toast.success(t('saveSuccess'))
      router.push(`/dashboard/${slug}/${projectId}`)
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e
      toastError(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteProjectAction(projectId, slug)
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e
      toastError(e)
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Page header */}
        <div className="glass rounded-2xl overflow-hidden shadow-card">
          <div className="gradient-brand-gold h-[3px]" />
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
              <Settings2 className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[0.9375rem] tracking-tight">{t('editTitle')}</h1>
              <p className="text-[11px] text-muted-foreground/65 mt-0.5">{t('namePlaceholder')}</p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form action={handleUpdate} className="glass rounded-2xl overflow-hidden shadow-card">
          <div className="h-[2px] gradient-brand opacity-50" />
          <div className="px-6 py-6 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {t('nameLabel')}
              </label>
              <input
                name="name"
                required
                minLength={2}
                placeholder={t('namePlaceholder')}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background/50
                           text-sm placeholder:text-muted-foreground/35
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                           transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {t('descriptionLabel')}
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-3.5 py-3 rounded-xl border border-border bg-background/50
                           text-sm placeholder:text-muted-foreground/35
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                           transition-all resize-none"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {t('colorLabel')}
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all duration-150
                                ${COLOR_STRIP_CLASS[c] ?? 'strip-indigo'}
                                ${color === c
                                  ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-card scale-110 shadow-sm'
                                  : 'hover:scale-105 opacity-60 hover:opacity-90'
                                }`}
                  />
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('startDateLabel')}
                </label>
                <input
                  name="startDate"
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setDateError('') }}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-background/50
                             text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                             focus:border-primary/60 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('endDateLabel')}
                </label>
                <input
                  name="endDate"
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setDateError('') }}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-background/50
                             text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                             focus:border-primary/60 transition-all"
                />
              </div>
            </div>

            {/* Date error */}
            {dateError && (
              <p className="text-[12px] text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {dateError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 justify-end pt-1 border-t border-border/40">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 text-sm rounded-xl border border-border/80
                           text-muted-foreground hover:text-foreground hover:bg-accent/70
                           transition-all font-medium"
              >
                {t('cancelButton')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-5 py-2.5 rounded-xl text-sm"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : null}
                {t('saveButton')}
              </button>
            </div>
          </div>
        </form>

        {/* Danger zone */}
        <div className="rounded-2xl overflow-hidden border border-destructive/30 bg-destructive/[0.04] shadow-card">
          <div className="h-[2px] bg-destructive opacity-60" />
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive shrink-0" />
              <h2 className="text-sm font-semibold text-destructive">{t('dangerZone')}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('deleteConfirm')}</p>
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-danger px-4 py-2.5 rounded-xl text-sm"
            >
              {t('deleteButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-md
                     flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(false) }}
        >
          <div className="glass-gold rounded-2xl overflow-hidden w-full max-w-sm card-enter">
            <div className="h-[3px] bg-destructive" />
            <div className="px-6 pt-5 pb-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-bold text-[0.9375rem] tracking-tight">{t('deleteButton')}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t('deleteConfirm')}</p>
                </div>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground
                             hover:text-foreground hover:bg-accent transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm rounded-xl border border-border/80
                             text-muted-foreground hover:text-foreground hover:bg-accent/70
                             transition-all font-medium disabled:opacity-50"
                >
                  {t('cancelButton')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 btn-danger px-5 py-2.5 rounded-xl text-sm"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : null}
                  {t('deleteButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
