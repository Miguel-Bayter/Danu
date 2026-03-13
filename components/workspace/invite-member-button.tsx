'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { sendInvitationAction } from '@/server/actions/invitation.actions'

interface InviteMemberButtonProps {
  workspaceId: string
  workspaceName: string
}

export function InviteMemberButton({ workspaceId, workspaceName }: InviteMemberButtonProps) {
  const t = useTranslations('invitation')
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setSuccess(false)
    setError(null)
    setEmail('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await sendInvitationAction(workspaceId, email)
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errorGeneric'))
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-sm px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
      >
        {t('inviteButton')}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h2 className="font-semibold">{t('inviteTitle', { workspace: workspaceName })}</h2>

            {success ? (
              <div className="space-y-3">
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('successMessage', { email })}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-2 rounded-md border hover:bg-accent transition-colors text-sm"
                >
                  {t('closeButton')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('emailLabel')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-md border hover:bg-accent transition-colors text-sm"
                  >
                    {t('cancelButton')}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-opacity"
                  >
                    {isPending ? '...' : t('sendButton')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
