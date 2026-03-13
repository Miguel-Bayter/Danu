'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteWorkspaceAction } from '@/server/actions/workspace.actions'
import { toast } from 'sonner'

interface DeleteWorkspaceButtonProps {
  workspaceId: string
}

export function DeleteWorkspaceButton({ workspaceId }: DeleteWorkspaceButtonProps) {
  const t = useTranslations('workspace')
  const te = useTranslations('errors')
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteWorkspaceAction(workspaceId)
        router.push('/dashboard')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'errors.generic'
        const key = msg.startsWith('errors.') ? msg.slice(7) : 'generic'
        toast.error(te(key as Parameters<typeof te>[0]))
        setShowConfirm(false)
      }
    })
  }

  return (
    <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-5 space-y-3">
      <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
        {t('deleteTitle')}
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t('deleteButton')}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('deleteConfirm')}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isPending ? '...' : t('deleteButton')}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
