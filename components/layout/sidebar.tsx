'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, LogOut, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col shrink-0 relative
                  bg-sidebar border-r border-sidebar-border
                  dark:bg-sidebar dark:backdrop-blur-xl
                  transition-[width] duration-300 ease-in-out
                  ${collapsed ? 'w-[60px]' : 'w-[240px]'}`}
    >
      {/* Aurora — reduced, dark only */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full
                        dark:bg-primary/[0.12] blur-[72px] animate-sidebar-aurora-1" />
        <div className="absolute -bottom-20 -right-8 w-56 h-56 rounded-full
                        dark:bg-violet-500/[0.08] blur-[72px] animate-sidebar-aurora-2" />
      </div>

      {/* ── Toggle tab — floats on the right border, same position in both states ── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        className="absolute right-0 top-3.5 translate-x-full z-50
                   w-7 h-7 flex items-center justify-center rounded-r-lg
                   bg-sidebar border border-l-0 border-sidebar-border
                   text-muted-foreground hover:text-foreground
                   dark:text-sidebar-foreground/60 dark:hover:text-sidebar-foreground
                   hover:bg-accent dark:hover:bg-muted
                   transition-all duration-150 shadow-sm"
      >
        {collapsed
          ? <ChevronsRight className="w-[14px] h-[14px]" />
          : <ChevronsLeft  className="w-[14px] h-[14px]" />}
      </button>

      {/* ── Header ─────────────────────────────────────────────── */}
      {collapsed ? (
        /* Collapsed header — logo centered */
        <div className="h-14 flex items-center justify-center relative z-10 shrink-0
                        border-b border-sidebar-border/70">
          <LogoMark size="xs" />
          <div className="gradient-brand-gold absolute bottom-0 left-0 right-0 h-[1px]
                          opacity-50 dark:opacity-90" />
        </div>
      ) : (
        /* Expanded header */
        <div className="h-14 flex items-center gap-2 px-3
                        border-b border-sidebar-border/70 relative z-10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1 min-w-0 group overflow-hidden">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-xl opacity-0 group-hover:opacity-100
                              bg-primary/10 blur-xl transition-all duration-500" />
              <LogoMark size="sm" className="relative z-10" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="font-bold text-sm leading-tight tracking-tight whitespace-nowrap
                            transition-colors duration-150 group-hover:text-primary">
                Danu
              </p>
              <p className="text-[9px] text-muted-foreground/40 leading-none truncate
                            tracking-[0.08em] uppercase font-semibold mt-[3px]">
                Project Management
              </p>
            </div>
          </Link>
          <LanguageSwitcher currentLocale={locale} />
          <div className="gradient-brand-gold absolute bottom-0 left-0 right-0 h-[1px]
                          opacity-50 dark:opacity-90" />
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden py-3 relative z-10 space-y-0.5
                    ${collapsed ? 'px-2' : 'px-2.5'}`}
      >
        <NavItem
          href="/dashboard"
          active={pathname === '/dashboard'}
          icon={<LayoutDashboard className="w-4 h-4" />}
          label={t('myWorkspaces')}
          collapsed={collapsed}
        />

        {/* Workspaces section */}
        <div className={collapsed ? 'pt-2 space-y-0.5' : 'pt-4'}>
          {!collapsed && (
            <button
              onClick={() => setWsExpanded((v) => !v)}
              className="group w-full flex items-center gap-2 px-2.5 py-[5px] mb-1 rounded-md
                         text-muted-foreground/50 dark:text-muted-foreground/40
                         hover:text-muted-foreground/80 transition-colors duration-150"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60
                                dark:via-primary/20 to-transparent" />
                <span className="text-[9px] font-bold uppercase tracking-[0.20em]
                                 select-none shrink-0 dark:text-sidebar-foreground/40">
                  {t('workspacesLabel')}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60
                                dark:via-primary/20 to-transparent" />
              </div>
              <ChevronDown
                className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200
                            text-muted-foreground/30 dark:text-primary/40
                            ${wsExpanded ? '' : '-rotate-90'}`}
              />
            </button>
          )}

          <div
            className={`space-y-0.5 overflow-hidden transition-all duration-200 ease-out
                        ${!collapsed && !wsExpanded ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}
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
                                  ${getGradientClass(ws.name)}`}
                    >
                      {ws.name[0].toUpperCase()}
                    </span>
                  }
                  label={ws.name}
                  badge={ws._count.projects > 0 ? ws._count.projects : undefined}
                  showChevron={active && !collapsed}
                  collapsed={collapsed}
                  noIconBg
                />
              )
            })}

            {workspaces.length === 0 && !collapsed && (
              <div className="mx-1 my-1 px-3 py-2.5 rounded-lg
                              border border-dashed border-border/40 dark:border-sidebar-foreground/[0.18]
                              bg-muted/20 dark:bg-muted/40">
                <p className="text-[10.5px] text-muted-foreground/50 dark:text-sidebar-foreground/50 leading-relaxed">
                  {t('noWorkspaces')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search — expanded only */}
        {!collapsed && (
          <div className="pt-3 space-y-1">
            <div className="h-px mx-1 bg-gradient-to-r from-transparent
                            via-border/50 dark:via-primary/15 to-transparent" />
            <CommandPalette />
          </div>
        )}
      </nav>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        className={`relative z-10 border-t border-sidebar-border/60
                    ${collapsed ? 'px-2 pt-2 pb-3' : 'px-2.5 pt-1.5 pb-2.5'}`}
      >
        {collapsed ? (
          /* Collapsed footer — tight grouped card */
          <div className="flex flex-col items-center gap-1">
            {/* Avatar */}
            <div className="relative mb-1">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? ''}
                  className="w-8 h-8 rounded-full ring-1 ring-border/60"
                />
              ) : (
                <div className="gradient-brand w-8 h-8 rounded-full flex items-center
                                justify-center text-[11px] font-bold text-white">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full
                               bg-emerald-400 ring-2 ring-sidebar" />
            </div>

            {/* Actions grouped in a card */}
            <div className="w-full rounded-xl border border-border/40 dark:border-muted/60
                            bg-muted/20 dark:bg-muted/30
                            flex flex-col items-center divide-y divide-border/30 dark:divide-muted/50
                            overflow-hidden">
              <div className="w-full flex justify-center py-1.5">
                <ThemeToggle />
              </div>
              <div className="w-full flex justify-center py-1.5">
                <NotificationBell userId={user.id} />
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                className="w-full flex justify-center py-1.5
                           text-muted-foreground/50 hover:text-destructive
                           hover:bg-destructive/[0.08] transition-all duration-150 group"
                title={t('signOut')}
              >
                <LogOut className="w-[14px] h-[14px] transition-transform duration-150
                                   group-hover:translate-x-[1px]" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded footer */
          <>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                            hover:bg-accent/40 dark:hover:bg-muted/40
                            transition-colors duration-150 group/user">
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

            <button
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              className="mt-0.5 w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg
                         text-[11.5px] text-muted-foreground/50 hover:text-destructive
                         hover:bg-destructive/[0.06] transition-all duration-150 group"
            >
              <LogOut className="w-[13px] h-[13px] shrink-0 transition-transform duration-150
                                 group-hover:translate-x-[2px]" />
              {t('signOut')}
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────

function NavItem({
  href, active, icon, label, badge, showChevron, collapsed, noIconBg,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  label: string
  badge?: number
  showChevron?: boolean
  collapsed?: boolean
  noIconBg?: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`
        group relative flex items-center rounded-xl overflow-hidden
        text-[12.5px] font-medium transition-all duration-150
        ${collapsed
          ? 'justify-center p-[10px]'
          : 'gap-2.5 px-2.5 py-[7px]'
        }
        ${active
          /* Light: dark fill. Dark: muted surface */
          ? 'bg-primary/[0.08] text-primary dark:bg-muted dark:text-sidebar-foreground font-semibold'
          : 'text-muted-foreground dark:text-sidebar-foreground/65 hover:bg-accent dark:hover:bg-muted hover:text-foreground dark:hover:text-sidebar-foreground'
        }
      `}
    >
      {/* Left bar — expanded active only */}
      {active && !collapsed && (
        <span className="gradient-brand-gold absolute left-0 top-[5px] bottom-[5px]
                         w-[3px] rounded-full" />
      )}
      {/* Ghost left bar on hover */}
      {!active && !collapsed && (
        <span className="absolute left-0 top-[5px] bottom-[5px] w-[2.5px] rounded-full
                         bg-transparent group-hover:bg-muted-foreground/20
                         transition-colors duration-150" />
      )}

      {/* Icon container */}
      <span
        className={`flex items-center justify-center shrink-0 rounded-lg
                    transition-all duration-150
                    ${collapsed ? 'w-[36px] h-[36px]' : 'w-[26px] h-[26px]'}
                    ${noIconBg
                      ? ''
                      : active
                        ? 'bg-primary/[0.12] dark:bg-background text-primary dark:text-foreground'
                        : 'bg-muted/50 dark:bg-muted text-muted-foreground dark:text-sidebar-foreground/70 group-hover:bg-accent dark:group-hover:bg-accent group-hover:text-foreground dark:group-hover:text-sidebar-foreground'
                    }`}
      >
        {icon}
      </span>

      {/* Label + badge — expanded only */}
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span
              className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                          tabular-nums flex items-center justify-center shrink-0
                          ${active
                            ? 'bg-primary/[0.15] dark:bg-background text-primary dark:text-foreground'
                            : 'bg-primary text-white'
                          }`}
            >
              {badge}
            </span>
          )}
          {showChevron && (
            <ChevronRight
              className="w-3 h-3 shrink-0 opacity-50 transition-transform duration-150
                         group-hover:translate-x-px"
            />
          )}
        </>
      )}

      {/* Badge dot — collapsed only */}
      {collapsed && badge !== undefined && (
        <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5
                         rounded-full bg-primary text-white text-[8px] font-bold
                         flex items-center justify-center leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
