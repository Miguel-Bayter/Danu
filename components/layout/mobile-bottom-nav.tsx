'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { LogoMark } from '@/components/ui/logo-mark'
import { NotificationBell } from '@/components/layout/notification-bell'

interface MobileBottomNavProps {
  userId: string
  userImage?: string | null
  userName?: string | null
}

export function MobileBottomNav({ userId, userImage, userName }: MobileBottomNavProps) {
  const pathname = usePathname()

  function openSearch() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
    )
  }

  async function handleSignOut() {
    if (window.confirm('¿Cerrar sesión?')) {
      await signOut({ callbackUrl: '/sign-in' })
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
      <div className="relative bg-card border border-border/50 rounded-2xl shadow-xl h-16 flex items-center px-1">

        {/* ── Left two items ── */}
        <div className="flex flex-1 items-center justify-around">

          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px]
                        justify-center rounded-xl transition-colors px-2
                        ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutDashboard className="w-[22px] h-[22px]" />
            {pathname === '/dashboard' && (
              <span className="text-[9px] font-bold tracking-wide">Inicio</span>
            )}
          </Link>

          {/* Search */}
          <button
            onClick={openSearch}
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px]
                       rounded-xl text-muted-foreground hover:text-foreground transition-colors px-2"
            aria-label="Buscar"
          >
            <Search className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* ── Center spacer (for elevated logo) ── */}
        <div className="w-16 shrink-0" />

        {/* ── Right two items ── */}
        <div className="flex flex-1 items-center justify-around">

          {/* Notifications */}
          <NotificationBell userId={userId} />

          {/* User / sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center min-w-[44px] min-h-[44px]
                       rounded-xl text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Cerrar sesión"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName ?? ''}
                className="w-7 h-7 rounded-full ring-2 ring-border/60"
              />
            ) : (
              <LogOut className="w-[22px] h-[22px]" />
            )}
          </button>
        </div>

        {/* ── Center elevated logo ── */}
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
  )
}
