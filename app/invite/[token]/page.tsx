import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { acceptInvitationAction } from '@/server/actions/invitation.actions'
import { auth } from '@/lib/auth'
import Link from 'next/link'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const session = await auth()
  const t = await getTranslations('invite')

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/invite/${token}`)
  }

  let workspaceSlug: string | null = null
  let errorKey: string | null = null

  try {
    const workspace = await acceptInvitationAction(token)
    workspaceSlug = workspace.slug
  } catch (err) {
    if (err instanceof Error && 'digest' in err) throw err
    const msg = err instanceof Error ? err.message : 'invite.genericError'
    errorKey = msg === 'invitation.invalidToken' ? 'invalidMessage' : 'genericError'
  }

  if (workspaceSlug) {
    redirect(`/dashboard/${workspaceSlug}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
          <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold">{t('invalidTitle')}</h1>
        <p className="text-muted-foreground text-sm">
          {t(errorKey === 'invalidMessage' ? 'invalidMessage' : 'genericError')}
        </p>
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  )
}
