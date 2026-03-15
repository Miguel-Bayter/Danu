/**
 * Tests for the Gantt bar calculation logic extracted from GanttChart as
 * pure functions so they can be tested without rendering.
 */

function toPct(date: Date, rangeStart: Date, totalMs: number): number {
  return ((date.getTime() - rangeStart.getTime()) / totalMs) * 100
}

function getBarBounds(
  startDate: string | null,
  endDate: string | null,
  toPctFn: (d: Date) => number
): { left: string; width: string } | null {
  if (!startDate || !endDate) return null
  const left = Math.max(0, toPctFn(new Date(startDate)))
  const right = Math.max(0, 100 - Math.min(100, toPctFn(new Date(endDate))))
  const width = 100 - left - right
  if (width <= 0) return null
  return { left: `${left}%`, width: `${width}%` }
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000

describe('toPct', () => {
  const rangeStart = new Date('2025-01-01')
  const rangeEnd = new Date('2026-01-01')
  const totalMs = rangeEnd.getTime() - rangeStart.getTime()

  it('returns 0 when date equals rangeStart', () => {
    expect(toPct(rangeStart, rangeStart, totalMs)).toBe(0)
  })

  it('returns 100 when date equals rangeEnd', () => {
    expect(toPct(rangeEnd, rangeStart, totalMs)).toBe(100)
  })
})

describe('getBarBounds', () => {
  it('returns null when startDate or endDate is null', () => {
    const noop = (_d: Date) => 0
    expect(getBarBounds(null, null, noop)).toBeNull()
    expect(getBarBounds('2025-01-01', null, noop)).toBeNull()
    expect(getBarBounds(null, '2025-12-31', noop)).toBeNull()
  })

  it('returns valid left and width percentages for a year-wide range', () => {
    const rangeStart = new Date('2025-01-01')
    const rangeEnd = new Date('2026-01-01')
    const totalMs = rangeEnd.getTime() - rangeStart.getTime()

    const boundToPct = (d: Date) => toPct(d, rangeStart, totalMs)

    const result = getBarBounds('2025-01-01', '2025-12-31', boundToPct)

    expect(result).not.toBeNull()

    const left = parseFloat(result!.left)
    const width = parseFloat(result!.width)

    // Both values must be non-negative
    expect(left).toBeGreaterThanOrEqual(0)
    expect(width).toBeGreaterThan(0)

    // left + width must not exceed 100
    expect(left + width).toBeLessThanOrEqual(100)
  })
})
