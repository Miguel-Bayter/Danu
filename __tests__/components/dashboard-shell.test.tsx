/**
 * Tests for the DashboardShell layout component.
 *
 * CommandPalette (rendered inside DashboardShell) imports a server action that
 * chains into next-auth → next/server, which cannot resolve in the jsdom
 * environment. We mock the action module so the test stays focused on layout.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/server/actions/search.actions', () => ({
  getSearchDataAction: vi.fn().mockResolvedValue({ projects: [], tasks: [] }),
}))

vi.mock('@/components/layout/command-palette', () => ({
  CommandPalette: () => null,
}))

import { DashboardShell } from '@/components/layout/dashboard-shell'

const sidebarContent = <div data-testid="sidebar-content">Sidebar</div>
const mobileNavContent = <nav data-testid="mobile-nav">MobileNav</nav>

describe('DashboardShell', () => {
  it('renders children content', () => {
    render(
      <DashboardShell sidebar={sidebarContent} mobileNav={mobileNavContent}>
        <p>Main content</p>
      </DashboardShell>
    )
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('renders the mobile nav slot', () => {
    render(
      <DashboardShell sidebar={sidebarContent} mobileNav={mobileNavContent}>
        <p>Content</p>
      </DashboardShell>
    )
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument()
  })

  it('renders the sidebar slot', () => {
    render(
      <DashboardShell sidebar={sidebarContent} mobileNav={mobileNavContent}>
        <p>Content</p>
      </DashboardShell>
    )
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
  })
})
