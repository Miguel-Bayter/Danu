'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { deleteProjectAction } from '@/server/actions/project.actions'
import type { Project } from '@prisma/client'
import { COLOR_STRIP_CLASS, COLOR_ACCENT_CLASS, APP_LOCALE } from '@/lib/constants'
import { LayoutList, Calendar, Pencil, Trash2 } from 'lucide-react'

type ProjectWithCount = Project & { _count: { tasks: number } }

interface ProjectCardProps {
  project: ProjectWithCount
  workspaceSlug: string
}

/**
 * Project card — thick left border accent in project color + glass treatment.
 * Spring-powered hover lift via motion. No overflow-hidden on root so the
 * dropdown menu is never clipped.
 */
export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = useTranslations('project')

  const stripClass  = project.color ? (COLOR_STRIP_CLASS[project.color]  ?? 'strip-indigo')  : 'strip-indigo'
  const accentClass = project.color ? (COLOR_ACCENT_CLASS[project.color] ?? 'accent-l-indigo') : 'accent-l-indigo'

  const endDateLabel = project.endDate
    ? new Date(project.endDate).toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })
    : null

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteProjectAction(project.id, workspaceSlug)
      toast.success(t('deleteSuccess'))
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e
      toast.error(e instanceof Error ? e.message : 'Error')
      setLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative border border-border border-l-[3px] ${accentClass} rounded-xl bg-card glass
                  group hover:border-primary/30
                  transition-[border-color,box-shadow] duration-200 shadow-card hover:shadow-card-hover`}
    >
      {/* ── Main navigable area ── */}
      <Link href={`/dashboard/${workspaceSlug}/${project.id}`} className="block p-4 pr-12">

        {/* Badge + name */}
        <div className="flex items-start gap-3">
          <div
            className={`${stripClass} w-10 h-10 rounded-xl flex items-center justify-center
                         text-white font-bold text-sm shrink-0 shadow-sm`}
          >
            {project.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
              {project.name}
            </p>
            {project.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/45 mt-1 italic">
                {t('descriptionPlaceholder')}
              </p>
            )}
          </div>
        </div>

        {/* Footer: task count + deadline */}
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <LayoutList className="w-3.5 h-3.5 shrink-0 opacity-50" />
            <span className="tabular-nums">
              {project._count.tasks === 1
                ? t('tasks_one', { count: 1 })
                : t('tasks_other', { count: project._count.tasks })}
            </span>
          </div>
          {endDateLabel && (
            <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/70 tabular-nums">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{endDateLabel}</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Context menu ── */}
      <div className="absolute top-3.5 right-3">
        <button
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
          className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground
                     hover:text-foreground hover:bg-accent transition-colors
                     opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current">
            <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-9 z-50 bg-popover border border-border rounded-xl shadow-card-hover py-1.5 w-44">
              <Link
                href={`/dashboard/${workspaceSlug}/${project.id}/settings`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2 mx-1 px-2.5 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0 opacity-55" />
                {t('editTitle')}
              </Link>
              <div className="h-px bg-border mx-2 my-1" />
              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(true) }}
                className="flex items-center gap-2 w-full text-left mx-1 px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-md"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {t('deleteButton')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden w-full max-w-sm shadow-modal">
            <div className="modal-stripe" />
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="font-semibold text-[0.9375rem]">{t('deleteButton')}</p>
                <p className="text-sm text-muted-foreground">{t('deleteConfirm')}</p>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setConfirmDelete(false)} disabled={loading} className="btn-ghost">
                  {t('cancelButton')}
                </button>
                <button onClick={handleDelete} disabled={loading} className="flex items-center gap-2 btn-danger">
                  {loading && (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {t('deleteButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
