'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Search, LogOut, Sun, Moon, Globe } from 'lucide-react'
import { LogoMark } from '@/components/ui/logo-mark'
import { NotificationBell } from '@/components/layout/notification-bell'
import { setLocaleAction } from '@/server/actions/locale.actions'
import { useRouter } from 'next/navigation'
import { useTransition, useEffect } from 'react'

interface MobileBottomNavProps {
  userId: string
  userImage?: string | null
  userName?: string | null
  locale: string
}

export function MobileBottomNav({ userId, userImage, userName, locale }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [localePending, startLocaleTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isHome      = pathname === '/dashboard'
  const isWorkspace = pathname.startsWith('/dashboard/') && pathname.split('/').length === 3
  const isProject   = pathname.startsWith('/dashboard/') && pathname.split('/').length >= 4
  const homeActive  = isHome || isWorkspace || isProject

  function activeLabel() {
    if (isHome) return 'Inicio'
    if (isProject) return 'Proyecto'
    if (isWorkspace) return 'Workspace'
    return null
  }

  function openSearch() {
    document.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  function switchLocale(next: string) {
    if (next === locale) return
    startLocaleTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  async function handleSignOut() {
    if (window.confirm('¿Cerrar sesión?')) {
      await signOut({ callbackUrl: '/sign-in' })
    }
  }

  const label = activeLabel()

  return (
    <>
      {/* Backdrop for user menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="mobile-bottom-nav fixed left-4 right-4 z-40 md:hidden">

        {/* User menu popup — appears above the nav bar */}
        {menuOpen && (
          <div className="absolute bottom-[calc(100%+12px)] right-0 z-50
                          bg-card border border-border/60 rounded-2xl shadow-2xl
                          p-3 space-y-1 w-52">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         hover:bg-accent transition-colors text-sm font-medium"
            >
              {mounted && resolvedTheme === 'dark'
                ? <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                : <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              }
              <span>{mounted && resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>

            {/* Language switcher */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 p-0.5">
                {(['es', 'en'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    disabled={localePending}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors leading-none ${
                      locale === loc
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border/50 mx-1" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         hover:bg-destructive/10 text-destructive transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* Nav bar */}
        <div className="relative bg-card border border-border/50 rounded-2xl shadow-xl h-16 flex items-center px-1">

          {/* Left two items */}
          <div className="flex flex-1 items-center justify-around">
            {/* Home */}
            <Link
              href="/dashboard"
              className={`flex flex-col items-center gap-0.5
                          min-w-[48px] min-h-[48px] justify-center
                          rounded-xl transition-colors px-2
                          ${homeActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutDashboard className="w-[22px] h-[22px]" />
              {homeActive && label && (
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              )}
            </Link>

            {/* Search */}
            <button
              onClick={openSearch}
              className="flex flex-col items-center justify-center
                         min-w-[48px] min-h-[48px]
                         rounded-xl text-muted-foreground hover:text-foreground transition-colors px-2"
              aria-label="Buscar"
            >
              <Search className="w-[22px] h-[22px]" />
            </button>
          </div>

          {/* Center spacer for floating logo */}
          <div className="w-16 shrink-0" />

          {/* Right two items */}
          <div className="flex flex-1 items-center justify-around">
            {/* Notifications */}
            <NotificationBell userId={userId} />

            {/* User menu trigger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center
                         min-w-[48px] min-h-[48px]
                         rounded-xl transition-colors"
              aria-label="Menú de usuario"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={userName ?? ''}
                  className={`w-7 h-7 rounded-full ring-2 transition-all ${
                    menuOpen ? 'ring-primary' : 'ring-border/60'
                  }`}
                />
              ) : (
                <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-[11px] font-bold">
                  {userName?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </button>
          </div>

          {/* Floating center logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[26px]">
            <Link href="/dashboard" aria-label="Inicio">
              <div
                className="w-[56px] h-[56px] rounded-full flex items-center justify-center
                           bg-primary shadow-lg shadow-primary/40
                           border-[3px] border-card
                           active:scale-95 transition-transform duration-150"
              >
                <LogoMark size="sm" />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
