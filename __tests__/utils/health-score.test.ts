/**
 * Tests for the health score calculation algorithm used in
 * server/repositories/task.repository.ts (getHealthScore) and the
 * UI classification helpers in app/dashboard/[slug]/page.tsx.
 *
 * All functions are replicated inline because they are either private or
 * embedded in server/RSC files that cannot be imported in a unit test context.
 */

/* ─── Replication of the core algorithm ─────────────────────────── */

function computeHealthScore(
  total: number,
  done: number,
  overdue: number,
): number | null {
  if (total === 0) return null
  const completionRate = (done / total) * 100
  const overduePenalty = (overdue / total) * 30
  return Math.round(Math.max(0, Math.min(100, completionRate - overduePenalty)))
}

/* ─── Replication of UI classification helpers ──────────────────── */

type ScoreClass = 'success' | 'warning' | 'orange' | 'danger'

function classifyScore(score: number): ScoreClass {
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  if (score >= 25) return 'orange'
  return 'danger'
}

function healthScoreLabel(score: number): string {
  if (score >= 75) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 25) return 'atRisk'
  return 'critical'
}

/* ─── Tests ──────────────────────────────────────────────────────── */

describe('computeHealthScore', () => {
  it('returns null when there are no tasks', () => {
    expect(computeHealthScore(0, 0, 0)).toBeNull()
  })

  it('returns 100 when all tasks are done and none are overdue', () => {
    expect(computeHealthScore(10, 10, 0)).toBe(100)
  })

  it('returns 0 when no tasks are done and none are overdue', () => {
    expect(computeHealthScore(10, 0, 0)).toBe(0)
  })

  it('returns 50 when half tasks are done and none are overdue', () => {
    expect(computeHealthScore(10, 5, 0)).toBe(50)
  })

  it('subtracts overdue penalty correctly (50% done, 20% overdue → 50 - 6 = 44)', () => {
    // 5/10 done → 50% rate; 2/10 overdue → 6% penalty; 50 - 6 = 44
    expect(computeHealthScore(10, 5, 2)).toBe(44)
  })

  it('clamps score to 0 when overdue penalty exceeds completion rate', () => {
    // 0 done, all overdue → max(0, 0 - 30) = 0
    expect(computeHealthScore(10, 0, 10)).toBe(0)
  })

  it('clamps score to 100 even if calculation exceeds it', () => {
    // 100% done, 0 overdue → min(100, 100 - 0) = 100
    expect(computeHealthScore(5, 5, 0)).toBe(100)
  })

  it('handles single-task workspace: done and not overdue → 100', () => {
    expect(computeHealthScore(1, 1, 0)).toBe(100)
  })

  it('handles single-task workspace: not done and overdue → 0', () => {
    expect(computeHealthScore(1, 0, 1)).toBe(0)
  })
})

describe('classifyScore', () => {
  it('classifies 100 as success', () => {
    expect(classifyScore(100)).toBe('success')
  })

  it('classifies 75 as success (boundary)', () => {
    expect(classifyScore(75)).toBe('success')
  })

  it('classifies 74 as warning', () => {
    expect(classifyScore(74)).toBe('warning')
  })

  it('classifies 50 as warning (boundary)', () => {
    expect(classifyScore(50)).toBe('warning')
  })

  it('classifies 49 as orange', () => {
    expect(classifyScore(49)).toBe('orange')
  })

  it('classifies 25 as orange (boundary)', () => {
    expect(classifyScore(25)).toBe('orange')
  })

  it('classifies 24 as danger', () => {
    expect(classifyScore(24)).toBe('danger')
  })

  it('classifies 0 as danger', () => {
    expect(classifyScore(0)).toBe('danger')
  })
})

describe('healthScoreLabel', () => {
  it('returns "excellent" for score >= 75', () => {
    expect(healthScoreLabel(80)).toBe('excellent')
    expect(healthScoreLabel(75)).toBe('excellent')
  })

  it('returns "good" for score 50–74', () => {
    expect(healthScoreLabel(60)).toBe('good')
    expect(healthScoreLabel(50)).toBe('good')
  })

  it('returns "atRisk" for score 25–49', () => {
    expect(healthScoreLabel(40)).toBe('atRisk')
    expect(healthScoreLabel(25)).toBe('atRisk')
  })

  it('returns "critical" for score < 25', () => {
    expect(healthScoreLabel(10)).toBe('critical')
    expect(healthScoreLabel(0)).toBe('critical')
  })
})
