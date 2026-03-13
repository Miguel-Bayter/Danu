import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserWorkspacesAction } from '@/server/actions/workspace.actions'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/sign-in')

  const workspaces = await getUserWorkspacesAction()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
          workspaces={workspaces}
          user={{
            id: session.user!.id as string,
            name: session.user!.name,
            email: session.user!.email,
            image: session.user!.image,
          }}
        />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
