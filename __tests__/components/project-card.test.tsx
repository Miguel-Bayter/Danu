/**
 * Tests for the ProjectCard component.
 *
 * Heavy deps (motion, next-intl, next/link, server actions, sonner) are mocked.
 * The component renders project metadata: name, description, task count, end date.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCard } from '@/components/project/project-card'

/* ─── Mocks ─────────────────────────────────────────────────────── */

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, args?: Record<string, unknown>) => {
    if (key === 'tasks_one')   return `${args?.count} task`
    if (key === 'tasks_other') return `${args?.count} tasks`
    return key
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, onClick }: any) =>
    React.createElement('a', { href, className, onClick }, children),
}))

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...rest }: any) =>
      React.createElement('div', { className, ...rest }, children),
  },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/server/actions/project.actions', () => ({
  deleteProjectAction: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, APP_LOCALE: 'en-US' }
})

/* ─── Fixtures ───────────────────────────────────────────────────── */

function makeProject(overrides = {}) {
  return {
    id: 'proj-1',
    name: 'Alpha Project',
    description: 'A test project description',
    status: 'ACTIVE',
    color: '#6366f1',
    startDate: null,
    endDate: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    workspaceId: 'ws-1',
    _count: { tasks: 3 },
    ...overrides,
  }
}

const SLUG = 'test-ws'

/* ─── Tests ──────────────────────────────────────────────────────── */

describe('ProjectCard', () => {
  it('renders the project name', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)
    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
  })

  it('renders task count (3 tasks)', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)
    expect(screen.getByText('3 tasks')).toBeInTheDocument()
  })

  it('renders "1 task" (singular) when task count is 1', () => {
    render(<ProjectCard project={makeProject({ _count: { tasks: 1 } })} workspaceSlug={SLUG} />)
    expect(screen.getByText('1 task')).toBeInTheDocument()
  })

  it('renders the project description', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)
    expect(screen.getByText('A test project description')).toBeInTheDocument()
  })

  it('renders placeholder text when description is null', () => {
    render(<ProjectCard project={makeProject({ description: null })} workspaceSlug={SLUG} />)
    // The translation key is returned as-is by the mock
    expect(screen.getByText('descriptionPlaceholder')).toBeInTheDocument()
  })

  it('renders end date when endDate is set', () => {
    render(
      <ProjectCard
        project={makeProject({ endDate: new Date('2026-12-31') })}
        workspaceSlug={SLUG}
      />,
    )
    // toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) → "Dec 2026"
    expect(screen.getByText(/Dec 2026/i)).toBeInTheDocument()
  })

  it('does not render a date when endDate is null', () => {
    render(<ProjectCard project={makeProject({ endDate: null })} workspaceSlug={SLUG} />)
    expect(screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)).toBeNull()
  })

  it('the main area links to the correct project page', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)
    const link = screen.getByRole('link', { name: /Alpha Project/i })
    expect(link).toHaveAttribute('href', `/dashboard/${SLUG}/proj-1`)
  })

  it('clicking the three-dot menu button shows Edit and Delete options', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)

    // Menu is hidden initially
    expect(screen.queryByText('deleteButton')).toBeNull()

    const menuBtn = screen.getByRole('button')
    fireEvent.click(menuBtn)

    expect(screen.getByText('editTitle')).toBeInTheDocument()
    expect(screen.getByText('deleteButton')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog after clicking Delete', () => {
    render(<ProjectCard project={makeProject()} workspaceSlug={SLUG} />)

    fireEvent.click(screen.getByRole('button'))  // open menu
    // There are now two "deleteButton" texts; click the one inside the dropdown
    const deleteBtn = screen.getAllByText('deleteButton')[0]
    fireEvent.click(deleteBtn)

    // Confirmation dialog shows "deleteConfirm" text
    expect(screen.getByText('deleteConfirm')).toBeInTheDocument()
  })

  it('renders 0 tasks correctly', () => {
    render(<ProjectCard project={makeProject({ _count: { tasks: 0 } })} workspaceSlug={SLUG} />)
    expect(screen.getByText('0 tasks')).toBeInTheDocument()
  })
})
