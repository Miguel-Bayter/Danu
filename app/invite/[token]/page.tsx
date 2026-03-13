import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { acceptInvitation } from '@/server/services/invitation.service'
import Link from 'next/link'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/invite/${token}`)
  }

  let workspaceSlug: string | null = null
  let errorMessage: string | null = null

  try {
    const workspace = await acceptInvitation(
      token,
      session.user.id,
      session.user.email ?? '',
    )
    workspaceSlug = workspace.slug
  } catch (err) {
    if (err instanceof Error && 'digest' in err) throw err
    errorMessage = err instanceof Error ? err.message : 'errors.generic'
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
        <h1 className="text-xl font-bold">Enlace inválido</h1>
        <p className="text-muted-foreground text-sm">
          {errorMessage === 'invitation.invalidToken'
            ? 'Este enlace de invitación no es válido o ha expirado.'
            : 'Ocurrió un error inesperado. Contacta al administrador del workspace.'}
        </p>
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
