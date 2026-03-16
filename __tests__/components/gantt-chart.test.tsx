/**
 * Tests for the GanttChart component.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { GanttChart } from '@/components/workspace/gantt-chart'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) =>
    React.createElement('a', { href, className }, children),
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return {
    ...actual,
    APP_LOCALE: 'en-US',
  }
})

const slug = 'test-slug'
const workspaceName = 'Test Workspace'

const undatedProjects = [
  {
    id: '1',
    name: 'No Date Project',
    color: '#6366f1',
    status: 'ACTIVE',
    startDate: null,
    endDate: null,
  },
]

const datedProjects = [
  {
    id: '2',
    name: 'Has Dates Project',
    color: '#22c55e',
    status: 'ACTIVE',
    startDate: '2020-01-01',
    endDate: '2030-12-31',
  },
]

describe('GanttChart', () => {
  it('renders empty state text (noProjects key) when all projects have no dates', () => {
    render(
      <GanttChart
        projects={undatedProjects}
        tasks={[]}
        slug={slug}
        workspaceName={workspaceName}
      />
    )
    expect(screen.getByText('noProjects')).toBeInTheDocument()
  })

  it('renders back button linking to /dashboard/test-slug', () => {
    render(
      <GanttChart
        projects={undatedProjects}
        tasks={[]}
        slug={slug}
        workspaceName={workspaceName}
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/test-slug')
  })

  it('renders workspace name "Test Workspace" in the back button', () => {
    render(
      <GanttChart
        projects={undatedProjects}
        tasks={[]}
        slug={slug}
        workspaceName={workspaceName}
      />
    )
    expect(screen.getByText('Test Workspace')).toBeInTheDocument()
  })

  it('renders project name in the row when a dated project is provided', () => {
    render(
      <GanttChart
        projects={datedProjects}
        tasks={[]}
        slug={slug}
        workspaceName={workspaceName}
      />
    )
    // The project name appears both in the name column and inside the gantt bar
    const matches = screen.getAllByText('Has Dates Project')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
