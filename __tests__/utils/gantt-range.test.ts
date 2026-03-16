/**
 * Tests for the date range helpers used in GanttChart:
 *   - computeRange  — auto-calculates full range from projects + tasks
 *   - applyPreset   — maps a RangePreset ('1m'|'3m'|'6m'|'all') to start/end dates
 *   - getBarBounds  — clamps start/end to [0,100] for CSS positioning
 *
 * All functions are replicated inline (they live inside the component file).
 */

export {}

/* ─── Type stubs ─────────────────────────────────────────────────── */

interface GanttProject {
  id: string
  name: string
  color: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface GanttTask {
  id: string
  title: string
  priority: string
  status: string
  startDate: string | null
  createdAt: string
  dueDate: string | null
  completedAt: string | null
  subtaskCount: number
  projectId: string
  projectName: string
  projectColor: string
  assignee: null
}

type RangePreset = '1m' | '3m' | '6m' | 'all'

/* ─── Replicated helpers ─────────────────────────────────────────── */

function datePct(d: Date, start: Date, totalMs: number): number {
  return ((d.getTime() - start.getTime()) / totalMs) * 100
}

function getBarBounds(
  start: Date,
  end: Date,
  rangeStart: Date,
  totalMs: number,
): { left: number; width: number } | null {
  const left  = Math.max(0, datePct(start, rangeStart, totalMs))
  const right = Math.max(0, 100 - Math.min(100, datePct(end, rangeStart, totalMs)))
  const w     = 100 - left - right
  if (w <= 0) return null
  return { left, width: w }
}

function computeRange(
  projects: GanttProject[],
  tasks: GanttTask[],
  today: Date,
): { start: Date; end: Date } {
  const ms: number[] = [today.getTime()]
  for (const p of projects) {
    if (p.startDate) ms.push(new Date(p.startDate).getTime())
    if (p.endDate)   ms.push(new Date(p.endDate).getTime())
  }
  for (const t of tasks) {
    if (t.dueDate) ms.push(new Date(t.dueDate).getTime())
    const barStart = t.startDate ?? t.createdAt
    ms.push(new Date(barStart).getTime())
  }
  const minMs = Math.min(...ms)
  const maxMs = Math.max(...ms)
  if (!isFinite(minMs) || !isFinite(maxMs)) {
    const fallback    = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const fallbackEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)
    return { start: fallback, end: fallbackEnd }
  }
  const minD = new Date(minMs)
  const maxD = new Date(maxMs)
  const start = new Date(minD.getFullYear(), minD.getMonth() - 1, 1)
  const end   = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 0)
  const diffMonths =
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
  if (diffMonths < 4) {
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 4, 0) }
  }
  return { start, end }
}

function applyPreset(
  preset: RangePreset,
  today: Date,
  fullStart: Date,
  fullEnd: Date,
): { start: Date; end: Date } {
  if (preset === 'all') return { start: fullStart, end: fullEnd }
  const months = preset === '1m' ? 1 : preset === '3m' ? 3 : 6
  const start  = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const end    = new Date(today.getFullYear(), today.getMonth() + months, 0)
  return { start, end }
}

/* ─── Tests: computeRange ───────────────────────────────────────── */

describe('computeRange', () => {
  const today = new Date('2026-03-15')

  it('always includes today in the range', () => {
    const { start, end } = computeRange([], [], today)
    expect(start.getTime()).toBeLessThanOrEqual(today.getTime())
    expect(end.getTime()).toBeGreaterThanOrEqual(today.getTime())
  })

  it('ensures at least 4 calendar months are covered when data is narrow', () => {
    // Single project spanning 1 week — computeRange should widen to ≥ 4 months
    const projects: GanttProject[] = [
      {
        id: '1', name: 'Short', color: '#6366f1', status: 'ACTIVE',
        startDate: '2026-03-10', endDate: '2026-03-17',
      },
    ]
    const { start, end } = computeRange(projects, [], today)
    // Count distinct months covered (start month through end month inclusive)
    const startTotal = start.getFullYear() * 12 + start.getMonth()
    const endTotal   = end.getFullYear()   * 12 + end.getMonth()
    expect(endTotal - startTotal + 1).toBeGreaterThanOrEqual(4)
  })

  it('expands range to include a project that spans multiple years', () => {
    const projects: GanttProject[] = [
      {
        id: '1', name: 'Big', color: '#6366f1', status: 'ACTIVE',
        startDate: '2024-01-01', endDate: '2027-12-31',
      },
    ]
    const { start, end } = computeRange(projects, [], today)
    expect(start.getTime()).toBeLessThanOrEqual(new Date('2024-01-01').getTime())
    expect(end.getTime()).toBeGreaterThanOrEqual(new Date('2027-12-31').getTime())
  })

  it('falls back to a safe range when given only undated items', () => {
    const projects: GanttProject[] = [
      { id: '1', name: 'No dates', color: '#6366f1', status: 'ACTIVE', startDate: null, endDate: null },
    ]
    const { start, end } = computeRange(projects, [], today)
    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
    expect(end.getTime()).toBeGreaterThan(start.getTime())
  })

  it('includes task dueDate when computing range', () => {
    const tasks: GanttTask[] = [
      {
        id: 't1', title: 'Far task', priority: 'HIGH', status: 'TODO',
        startDate: null, createdAt: '2026-03-15T00:00:00Z',
        dueDate: '2028-06-01', completedAt: null, subtaskCount: 0,
        projectId: 'p1', projectName: 'P', projectColor: '#6366f1', assignee: null,
      },
    ]
    const { end } = computeRange([], tasks, today)
    expect(end.getTime()).toBeGreaterThanOrEqual(new Date('2028-06-01').getTime())
  })
})

/* ─── Tests: applyPreset ─────────────────────────────────────────── */

describe('applyPreset', () => {
  const today     = new Date('2026-03-15')
  const fullStart = new Date('2025-01-01')
  const fullEnd   = new Date('2027-12-31')

  it('"all" preset returns the full range', () => {
    const { start, end } = applyPreset('all', today, fullStart, fullEnd)
    expect(start).toBe(fullStart)
    expect(end).toBe(fullEnd)
  })

  it('"1m" preset starts Feb 1 (1 month before today) and ends Mar 31', () => {
    // Formula: end = new Date(year, month + 1, 0) = day-0 of next month = last day of current month
    const { start, end } = applyPreset('1m', today, fullStart, fullEnd)
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(1)  // February (0-indexed)
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(2)    // March 31 (day-0 of April = last day of March)
  })

  it('"3m" preset ends May 31 (last day of current month + 2)', () => {
    // new Date(2026, 2+3, 0) = day-0 of June = May 31 (month index 4)
    const { end } = applyPreset('3m', today, fullStart, fullEnd)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(4)    // May (0-indexed)
  })

  it('"6m" preset ends Aug 31 (last day of current month + 5)', () => {
    // new Date(2026, 2+6, 0) = day-0 of September = August 31 (month index 7)
    const { end } = applyPreset('6m', today, fullStart, fullEnd)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(7)    // August (0-indexed)
  })

  it('end is always after start for all presets', () => {
    for (const preset of ['1m', '3m', '6m', 'all'] as RangePreset[]) {
      const { start, end } = applyPreset(preset, today, fullStart, fullEnd)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    }
  })
})

/* ─── Tests: getBarBounds ────────────────────────────────────────── */

describe('getBarBounds', () => {
  const rangeStart = new Date('2026-02-01')
  const rangeEnd   = new Date('2026-04-30')
  const totalMs    = rangeEnd.getTime() - rangeStart.getTime()

  it('returns null when bar ends before range starts', () => {
    const result = getBarBounds(
      new Date('2025-10-01'), new Date('2026-01-15'), rangeStart, totalMs,
    )
    expect(result).toBeNull()
  })

  it('returns null when bar starts after range ends', () => {
    const result = getBarBounds(
      new Date('2026-05-01'), new Date('2026-06-01'), rangeStart, totalMs,
    )
    expect(result).toBeNull()
  })

  it('bar fully within range: left > 0, width > 0, left + width <= 100', () => {
    const result = getBarBounds(
      new Date('2026-03-01'), new Date('2026-03-31'), rangeStart, totalMs,
    )
    expect(result).not.toBeNull()
    const { left, width } = result!
    expect(left).toBeGreaterThanOrEqual(0)
    expect(width).toBeGreaterThan(0)
    expect(left + width).toBeLessThanOrEqual(100)
  })

  it('bar extending past range end is clamped: left + width <= 100', () => {
    // Bar starts inside range but ends well beyond it
    const result = getBarBounds(
      new Date('2026-04-15'), new Date('2026-07-01'), rangeStart, totalMs,
    )
    expect(result).not.toBeNull()
    const { left, width } = result!
    expect(left + width).toBeLessThanOrEqual(100)
  })

  it('bar starting before range is clamped: left = 0', () => {
    const result = getBarBounds(
      new Date('2025-12-01'), new Date('2026-03-15'), rangeStart, totalMs,
    )
    expect(result).not.toBeNull()
    expect(result!.left).toBe(0)
    expect(result!.width).toBeGreaterThan(0)
  })
})
