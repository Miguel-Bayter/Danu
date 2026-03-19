'use client'

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
        <main className="flex-1 overflow-auto pb-24 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      {mobileNav}
    </div>
  )
}
