'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, LogOut, ChevronRight, ChevronDown } from 'lucide-react'
import type { Workspace } from '@prisma/client'
import { NotificationBell } from '@/components/layout/notification-bell'
import { CommandPalette } from '@/components/layout/command-palette'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { getGradientClass } from '@/lib/constants'
import { LogoMark } from '@/components/ui/logo-mark'

type WorkspaceWithCount = Workspace & { _count: { projects: number } }

interface SidebarProps {
  workspaces: WorkspaceWithCount[]
  user: { id: string; name?: string | null; email?: string | null; image?: string | null }
  locale: string
}

export function Sidebar({ workspaces, user, locale }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')
  const [wsExpanded, setWsExpanded] = useState(true)

  return (
    <aside className="w-[252px] flex flex-col shrink-0 relative overflow-hidden
                      bg-sidebar border-r border-sidebar-border
                      dark:bg-sidebar dark:backdrop-blur-xl">

      {/* Ambient aurora — dark mode depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-16 -left-8 w-72 h-72 rounded-full
                        dark:bg-primary/[0.22] blur-[56px] animate-sidebar-aurora-1" />
        <div className="absolute -bottom-16 -right-6 w-64 h-64 rounded-full
                        dark:bg-violet-500/[0.16] blur-[56px] animate-sidebar-aurora-2" />
        {/* Central depth glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full
                        dark:bg-primary/[0.06] blur-[48px]" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4
                      border-b border-sidebar-border/70 relative z-10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 rounded-xl opacity-0 group-hover:opacity-100
                            bg-primary/10 blur-xl transition-all duration-500" />
            <LogoMark size="sm" className="relative z-10" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight tracking-tight
                          transition-colors duration-150 group-hover:text-primary">
              Danu
            </p>
            <p className="text-[9px] text-muted-foreground/40 leading-none
                          tracking-[0.16em] uppercase font-semibold mt-[3px]">
              Project Management
            </p>
          </div>
        </Link>

        <div className="shrink-0">
          <LanguageSwitcher currentLocale={locale} />
        </div>

        {/* Brand accent line */}
        <div className="gradient-brand-gold absolute bottom-0 left-0 right-0 h-[1px] opacity-50 dark:opacity-90" />
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 relative z-10 space-y-0.5">

        {/* Overview */}
        <NavItem
          href="/dashboard"
          active={pathname === '/dashboard'}
          icon={<LayoutDashboard className="w-[15px] h-[15px]" />}
          label={t('myWorkspaces')}
        />

        {/* Workspaces section */}
        <div className="pt-3">
          <button
            onClick={() => setWsExpanded((v) => !v)}
            className="group w-full flex items-center gap-1.5 px-2 py-1 mb-0.5 rounded-md
                       text-muted-foreground/40 hover:text-muted-foreground/65
                       transition-colors duration-150"
          >
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform duration-200
                          ${wsExpanded ? '' : '-rotate-90'}`}
            />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] select-none">
              {t('workspacesLabel')}
            </span>
          </button>

          <div
            className={`space-y-0.5 overflow-hidden transition-all duration-200 ease-out
                        ${wsExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {workspaces.map((ws) => {
              const href = `/dashboard/${ws.slug}`
              const active = pathname.startsWith(href)
              return (
                <NavItem
                  key={ws.id}
                  href={href}
                  active={active}
                  icon={
                    <span
                      className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center
                                  text-[9.5px] font-black text-white select-none shrink-0
                                  transition-colors duration-200
                                  ${active ? getGradientClass(ws.name) : 'bg-muted-foreground/20'}`}
                    >
                      {ws.name[0].toUpperCase()}
                    </span>
                  }
                  label={ws.name}
                  badge={ws._count.projects > 0 ? ws._count.projects : undefined}
                  showChevron={active}
                />
              )
            })}

            {workspaces.length === 0 && (
              <p className="text-[11px] text-muted-foreground/40 px-2.5 py-1.5 italic">
                {t('noWorkspaces')}
              </p>
            )}
          </div>
        </div>

        {/* Separator + Search */}
        <div className="pt-3 space-y-1">
          <div className="h-px mx-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <CommandPalette />
        </div>
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="relative z-10 px-2.5 pt-2 pb-2.5 border-t border-sidebar-border/60">

        {/* User row */}
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                     hover:bg-accent/40 transition-colors duration-150 group/user"
        >
          <div className="relative shrink-0">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ''}
                className="w-7 h-7 rounded-full ring-1 ring-border/60
                           transition-transform duration-200 group-hover/user:scale-105"
              />
            ) : (
              <div className="gradient-brand w-7 h-7 rounded-full flex items-center
                              justify-center text-[11px] font-bold text-white
                              transition-transform duration-200 group-hover/user:scale-105">
                {user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            {/* Status dot */}
            <span className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full
                             bg-emerald-400 ring-2 ring-sidebar" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate leading-snug">{user.name}</p>
            <p className="text-[9.5px] text-muted-foreground/45 truncate leading-none mt-[2px]">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <ThemeToggle />
            <NotificationBell userId={user.id} />
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/sign-in' })}
          className="mt-0.5 w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg
                     text-[11.5px] text-muted-foreground/50 hover:text-destructive
                     hover:bg-destructive/[0.06] transition-all duration-150 group"
        >
          <LogOut
            className="w-[13px] h-[13px] shrink-0 transition-transform duration-150
                       group-hover:translate-x-[2px]"
          />
          {t('signOut')}
        </button>
      </div>

    </aside>
  )
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  href, active, icon, label, badge, showChevron,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  label: string
  badge?: number
  showChevron?: boolean
}) {
  return (
    <Link
      href={href}
      className={`
        group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg
        text-[12.5px] font-medium transition-all duration-150 overflow-hidden
        ${active
          ? 'bg-primary/[0.08] dark:bg-primary/[0.20] text-primary font-semibold dark:ring-1 dark:ring-primary/[0.30]'
          : 'text-muted-foreground/70 hover:bg-accent/50 dark:hover:bg-white/[0.05] hover:text-foreground'
        }
      `}
    >
      {/* Active: brand-gold left indicator + soft bloom */}
      {active && (
        <>
          <span className="gradient-brand-gold absolute left-0 top-[5px] bottom-[5px]
                           w-[3px] rounded-full" />
          <span className="absolute left-0 top-[5px] bottom-[5px] w-[3px] rounded-full
                           blur-[4px] bg-primary/60 dark:bg-primary/80" />
        </>
      )}

      {/* Ghost indicator on hover */}
      {!active && (
        <span className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-full
                         bg-transparent group-hover:bg-muted-foreground/20
                         transition-colors duration-150" />
      )}

      {/* Icon container */}
      <span
        className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0
                    transition-all duration-150
                    ${active
                      ? 'bg-primary/[0.12] dark:bg-primary/[0.28] text-primary'
                      : 'bg-muted/50 dark:bg-white/[0.06] text-muted-foreground/70 dark:text-muted-foreground/60 group-hover:bg-muted/80 dark:group-hover:bg-white/[0.10] group-hover:text-foreground'
                    }`}
      >
        {icon}
      </span>

      <span className="flex-1 truncate">{label}</span>

      {badge !== undefined && (
        <span
          className={`text-[10px] tabular-nums px-1.5 py-px rounded-[4px] shrink-0 font-medium
                      transition-colors duration-150
                      ${active
                        ? 'bg-primary/10 dark:bg-primary/[0.25] text-primary'
                        : 'bg-muted/70 dark:bg-white/[0.06] text-muted-foreground dark:text-muted-foreground/60 group-hover:bg-primary/8 group-hover:text-primary/80'
                      }`}
        >
          {badge}
        </span>
      )}

      {showChevron && (
        <ChevronRight
          className="w-3 h-3 text-primary/40 dark:text-primary/60 shrink-0
                     transition-transform duration-150 group-hover:translate-x-px"
        />
      )}
    </Link>
  )
}
