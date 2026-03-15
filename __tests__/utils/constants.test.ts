/**
 * Tests for lib/constants.ts.
 * @prisma/client is mocked because constants.ts imports Priority and TaskStatus
 * from it, and Prisma generates that module from the schema at build time.
 */

vi.mock('@prisma/client', () => ({
  Priority: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' },
  TaskStatus: {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    IN_REVIEW: 'IN_REVIEW',
    DONE: 'DONE',
  },
}))

import {
  getGradientClass,
  PRIORITY_COLORS,
  COLOR_OPTIONS,
  STATUS_ORDER,
} from '@/lib/constants'

describe('getGradientClass', () => {
  it('returns a string matching /^gradient-mono-[0-4]$/', () => {
    const result = getGradientClass('Alpha')
    expect(result).toMatch(/^gradient-mono-[0-4]$/)
  })

  it('is deterministic — same input always returns the same value', () => {
    const first = getGradientClass('MyWorkspace')
    const second = getGradientClass('MyWorkspace')
    expect(first).toBe(second)
  })
})

describe('PRIORITY_COLORS', () => {
  it('has keys: LOW, MEDIUM, HIGH, URGENT', () => {
    const keys = Object.keys(PRIORITY_COLORS)
    expect(keys).toContain('LOW')
    expect(keys).toContain('MEDIUM')
    expect(keys).toContain('HIGH')
    expect(keys).toContain('URGENT')
  })
})

describe('COLOR_OPTIONS', () => {
  it('has exactly 10 hex colors (all strings starting with "#")', () => {
    expect(COLOR_OPTIONS).toHaveLength(10)
    COLOR_OPTIONS.forEach((color) => {
      expect(typeof color).toBe('string')
      expect(color.startsWith('#')).toBe(true)
    })
  })
})

describe('STATUS_ORDER', () => {
  it('has 4 elements in order: TODO, IN_PROGRESS, IN_REVIEW, DONE', () => {
    expect(STATUS_ORDER).toHaveLength(4)
    expect(STATUS_ORDER[0]).toBe('TODO')
    expect(STATUS_ORDER[1]).toBe('IN_PROGRESS')
    expect(STATUS_ORDER[2]).toBe('IN_REVIEW')
    expect(STATUS_ORDER[3]).toBe('DONE')
  })
})
