'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface DashboardShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close mobile drawer when navigating to a new route
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex shrink-0">{sidebar}</div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            {sidebar}
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 h-14 px-4 border-b bg-card md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl
                       hover:bg-accent active:bg-accent/80 transition-colors -ml-2"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-base tracking-tight">Danu</span>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
