'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { generateInviteLinkAction } from '@/server/actions/invitation.actions'
import { Copy, Check } from 'lucide-react'

interface InviteMemberButtonProps {
  workspaceId: string
  workspaceName: string
}

export function InviteMemberButton({ workspaceId, workspaceName }: InviteMemberButtonProps) {
  const t = useTranslations('invitation')
  const [open, setOpen] = useState(false)
  const [githubUser, setGithubUser] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setInviteUrl(null)
    setError(null)
    setGithubUser('')
    setCopied(false)
  }

  function handleClose() {
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await generateInviteLinkAction(workspaceId, githubUser)
        setInviteUrl(result.inviteUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errorGeneric'))
      }
    })
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

            {!inviteUrl ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('emailLabel')}</label>
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('emailHint')}</p>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2 rounded-md border hover:bg-accent transition-colors text-sm"
                  >
                    {t('cancelButton')}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-opacity"
                  >
                    {isPending ? '...' : t('generateButton')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('linkReady')}</p>
                  <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/40">
                    <span className="text-xs font-mono flex-1 truncate text-muted-foreground">
                      {inviteUrl}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
                      aria-label={t('copyButton')}
                    >
                      {copied
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t('linkExpiry')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setInviteUrl(null); setGithubUser('') }}
                    className="flex-1 py-2 rounded-md border hover:bg-accent transition-colors text-sm"
                  >
                    {t('inviteAnother')}
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
                  >
                    {t('closeButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
