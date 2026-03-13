import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUserWorkspacesAction } from '@/server/actions/workspace.actions'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/sign-in')

  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'es'

  const workspaces = await getUserWorkspacesAction()

  return (
    <DashboardShell
      sidebar={
        <Sidebar
          workspaces={workspaces}
          user={{
            id: session.user!.id as string,
            name: session.user!.name,
            email: session.user!.email,
            image: session.user!.image,
          }}
          locale={locale}
        />
      }
    >
      {children}
    </DashboardShell>
  )
}
