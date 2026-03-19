import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getUserWorkspacesAction } from '@/server/actions/workspace.actions'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/sign-in')

  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'es'

  const workspaces = await getUserWorkspacesAction()
  const user = {
    id: session.user!.id as string,
    name: session.user!.name,
    email: session.user!.email,
    image: session.user!.image,
  }

  return (
    <DashboardShell
      sidebar={<Sidebar workspaces={workspaces} user={user} locale={locale} />}
      mobileNav={
        <MobileBottomNav
          userId={user.id}
          userImage={user.image}
          userName={user.name}
          locale={locale}
        />
      }
    >
      {children}
    </DashboardShell>
  )
}
