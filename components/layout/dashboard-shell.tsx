'use client'

import { CommandPalette } from '@/components/layout/command-palette'

interface DashboardShellProps {
  sidebar: React.ReactNode
  mobileNav: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({ sidebar, mobileNav, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex shrink-0">{sidebar}</div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* P1-FIX: padding dinámico con safe-area para iOS */}
        <main
          className="flex-1 overflow-auto md:pb-0 mobile-safe-pb"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {mobileNav}

      {/* Command palette modal — always mounted so mobile search button works */}
      <CommandPalette showTrigger={false} />
    </div>
  )
}
