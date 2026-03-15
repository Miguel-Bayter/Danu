/**
 * Tests for the DashboardShell layout component.
 * No mocks required — the component only uses useState and lucide-react icons.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardShell } from '@/components/layout/dashboard-shell'

const sidebarContent = <div data-testid="sidebar-content">Sidebar</div>

describe('DashboardShell', () => {
  it('renders children content', () => {
    render(
      <DashboardShell sidebar={sidebarContent}>
        <p>Main content</p>
      </DashboardShell>
    )
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('mobile hamburger button is in the DOM (aria-label="Toggle navigation")', () => {
    render(
      <DashboardShell sidebar={sidebarContent}>
        <p>Content</p>
      </DashboardShell>
    )
    expect(
      screen.getByRole('button', { name: /toggle navigation/i })
    ).toBeInTheDocument()
  })

  it('clicking hamburger shows sidebar overlay (backdrop div appears)', () => {
    render(
      <DashboardShell sidebar={sidebarContent}>
        <p>Content</p>
      </DashboardShell>
    )

    // Backdrop should not be present before clicking
    expect(
      document.querySelector('.fixed.inset-0.bg-black\\/50')
    ).toBeNull()

    const hamburger = screen.getByRole('button', { name: /toggle navigation/i })
    fireEvent.click(hamburger)

    // After clicking, the backdrop overlay should be present
    expect(
      document.querySelector('.fixed.inset-0')
    ).toBeInTheDocument()
  })
})
