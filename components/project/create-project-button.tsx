'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FolderKanban, X } from 'lucide-react'
import { createProjectAction } from '@/server/actions/project.actions'
import { COLOR_OPTIONS, COLOR_STRIP_CLASS } from '@/lib/constants'

interface CreateProjectButtonProps {
  workspaceId: string
  workspaceSlug: string
}

export function CreateProjectButton({ workspaceId, workspaceSlug }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('project')
  const te = useTranslations('errors')

  const _d = new Date()
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`

  function toastError(e: unknown) {
    const msg = e instanceof Error ? e.message : 'generic'
    const key = msg.startsWith('errors.') ? msg.slice(7) : 'generic'
    toast.error(te(key))
  }

  async function handleSubmit(formData: FormData) {
    const sd = formData.get('startDate') as string
    const ed = formData.get('endDate') as string
    if (!sd || !ed) { toast.error(t('datesRequired')); return }
    if (ed < sd) { toast.error(te('endDateBeforeStart')); return }
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 gradient-brand text-white rounded-lg text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-glow-sm"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth={2.5}>
          <path strokeLinecap="round" d="M8 3v10M3 8h10" />
        </svg>
        {t('newButton')}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-md
                     flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="glass-gold rounded-2xl overflow-hidden w-full max-w-md card-enter">

            {/* Accent stripe */}
            <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start gap-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="font-bold text-[0.9375rem] tracking-tight leading-snug">
                  {t('createTitle')}
                </h2>
                <p className="text-[11.5px] text-muted-foreground/65 mt-0.5">
                  {t('namePlaceholder')}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground
                           hover:text-foreground hover:bg-accent transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('nameLabel')}
                </label>
                <input
                  name="name"
                  required
                  minLength={2}
                  autoFocus
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
                  rows={2}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background/50
                             text-sm placeholder:text-muted-foreground/35
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                             transition-all resize-none"
                />
              </div>

              {/* Color picker */}
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
                      className={`w-7 h-7 rounded-full transition-all duration-150 ${COLOR_STRIP_CLASS[c] ?? 'strip-indigo'} ${
                        color === c
                          ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-card shadow-sm'
                          : 'hover:scale-105 opacity-60 hover:opacity-90'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {t('startDateLabel')}
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                    required
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-background/50
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary/60 transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
                  {t('createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
