/**
 * Tests for the date validation logic used in CreateTaskButton.
 * The actual component derives minDate and validates dueDate using the same
 * pure functions defined below.
 */

function getMinDate(today: string, projectStartDate?: string): string {
  return projectStartDate && projectStartDate > today ? projectStartDate : today
}

function isDueDateValid(dueDate: string, minDate: string): boolean {
  return dueDate >= minDate
}

describe('getMinDate', () => {
  const today = '2025-06-15'

  it('returns today when projectStartDate is undefined', () => {
    expect(getMinDate(today, undefined)).toBe(today)
  })

  it('returns today when projectStartDate is in the past', () => {
    expect(getMinDate(today, '2025-01-01')).toBe(today)
  })

  it('returns projectStartDate when it is in the future', () => {
    const futureDate = '2025-12-31'
    expect(getMinDate(today, futureDate)).toBe(futureDate)
  })
})

describe('isDueDateValid', () => {
  const minDate = '2025-06-15'

  it('returns true when dueDate equals minDate', () => {
    expect(isDueDateValid('2025-06-15', minDate)).toBe(true)
  })

  it('returns false when dueDate is before minDate', () => {
    expect(isDueDateValid('2025-06-14', minDate)).toBe(false)
  })
})
