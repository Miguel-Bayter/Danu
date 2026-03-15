'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { LayoutDashboard, X } from 'lucide-react'
import { createWorkspaceAction } from '@/server/actions/workspace.actions'

export function CreateWorkspaceButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations('workspace')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createWorkspaceAction(formData)
      toast.success(t('createSuccess'))
      router.push(`/dashboard/${result.slug}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('errorGeneric'))
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
          <div className="glass-gold rounded-2xl overflow-hidden w-full max-w-sm card-enter">

            {/* Accent stripe */}
            <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start gap-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
                <LayoutDashboard className="w-5 h-5 text-white" />
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
            <form action={handleSubmit} className="px-6 py-5 space-y-5">
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

              <div className="flex gap-2.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm rounded-xl border border-border/80
                             text-muted-foreground hover:text-foreground hover:bg-accent/70
                             transition-all font-medium disabled:opacity-50"
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
