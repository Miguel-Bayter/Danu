'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard } from 'lucide-react'
import type { Workspace } from '@prisma/client'
import { NotificationBell } from '@/components/layout/notification-bell'
import { CommandPalette } from '@/components/layout/command-palette'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ThemeToggle } from '@/components/layout/theme-toggle'

type WorkspaceWithCount = Workspace & { _count: { projects: number } }

interface SidebarProps {
  workspaces: WorkspaceWithCount[]
  user: { id: string; name?: string | null; email?: string | null; image?: string | null }
  locale: string
}

export function Sidebar({ workspaces, user, locale }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')

  return (
    <aside className="w-60 flex flex-col border-r bg-card shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b">
        <span className="font-bold text-lg tracking-tight">Danu</span>
        <LanguageSwitcher currentLocale={locale} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Back to all workspaces */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors mb-2 ${
            pathname === '/dashboard'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
          <span>{t('myWorkspaces')}</span>
        </Link>

        <p className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
          {t('workspacesLabel')}
        </p>

        {workspaces.map((ws) => {
          const href = `/dashboard/${ws.slug}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={ws.id}
              href={href}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
              <span className="truncate">{ws.name}</span>
            </Link>
          )
        })}

        {workspaces.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1">{t('noWorkspaces')}</p>
        )}

        <div className="pt-1">
          <CommandPalette />
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t p-3 space-y-1">
        <div className="flex items-center gap-2 px-2 py-1.5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell userId={user.id} />
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
        >
          {t('signOut')}
        </button>
      </div>
    </aside>
  )
}
