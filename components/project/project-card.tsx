'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { deleteProjectAction } from '@/server/actions/project.actions'
import type { Project } from '@prisma/client'

type ProjectWithCount = Project & { _count: { tasks: number } }

interface ProjectCardProps {
  project: ProjectWithCount
  workspaceSlug: string
}

export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = useTranslations('project')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await deleteProjectAction(project.id, workspaceSlug)
    } catch (e) {
      if (e instanceof Error && 'digest' in e) throw e // re-throw Next.js redirect
      setError(e instanceof Error ? e.message : 'Error')
      setLoading(false)
    }
  }

  return (
    <div className="relative border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all bg-card group">
      <Link href={`/dashboard/${workspaceSlug}/${project.id}`} className="block">
        <div className="flex items-center gap-3 pr-8">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          <p className="font-semibold truncate group-hover:text-primary transition-colors">
            {project.name}
          </p>
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {project._count.tasks === 1 ? t('tasks_one', { count: 1 }) : t('tasks_other', { count: project._count.tasks })}
        </p>
      </Link>

      {/* Menu button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu) }}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
        >
          ···
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 bg-card border rounded-lg shadow-lg py-1 min-w-32">
              <Link
                href={`/dashboard/${workspaceSlug}/${project.id}/settings`}
                onClick={() => setShowMenu(false)}
                className="block px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                {t('editTitle')}
              </Link>
              <button
                onClick={() => { setShowMenu(false); setConfirmDelete(true) }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                {t('deleteButton')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
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
