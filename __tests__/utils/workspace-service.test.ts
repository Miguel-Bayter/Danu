/**
 * Tests for pure logic extracted from server/services/workspace.service.ts.
 *
 * The `slugify` function and role-hierarchy values are replicated inline
 * because workspace.service.ts calls Prisma repositories and cannot be
 * imported directly in a unit test context.
 */

/* ─── Replication of slugify (workspace.service.ts, private) ──── */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

/* ─── Replication of role hierarchy ────────────────────────────── */

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
}

function hasPermission(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

/* ─── Replication of createWorkspace validation ─────────────────── */

function validateWorkspaceName(name: string): void {
  if (!name || name.trim().length < 2) {
    throw new Error('errors.nameTooShort')
  }
}

/* ─── Tests: slugify ────────────────────────────────────────────── */

describe('slugify', () => {
  it('lowercases the input', () => {
    expect(slugify('Hello')).toBe('hello')
  })

  it('replaces spaces with dashes', () => {
    expect(slugify('My Project')).toBe('my-project')
  })

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  trimmed  ')).toBe('trimmed')
  })

  it('collapses multiple spaces into a single dash', () => {
    expect(slugify('a   b')).toBe('a-b')
  })

  it('removes special characters (! @ # $ etc.)', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('keeps hyphens already in the string', () => {
    expect(slugify('my-project')).toBe('my-project')
  })

  it('collapses multiple consecutive dashes into one', () => {
    expect(slugify('foo--bar')).toBe('foo-bar')
  })

  it('truncates at 48 characters', () => {
    const long = 'a'.repeat(60)
    expect(slugify(long)).toHaveLength(48)
  })

  it('handles names with numbers', () => {
    expect(slugify('Project 2024')).toBe('project-2024')
  })

  it('returns an empty string for an all-symbol input', () => {
    // All symbols stripped, trim → empty
    expect(slugify('!!!')).toBe('')
  })
})

/* ─── Tests: validateWorkspaceName ─────────────────────────────── */

describe('validateWorkspaceName', () => {
  it('accepts a valid name (>= 2 chars)', () => {
    expect(() => validateWorkspaceName('My Workspace')).not.toThrow()
  })

  it('accepts a 2-character name', () => {
    expect(() => validateWorkspaceName('AB')).not.toThrow()
  })

  it('throws for a single-character name', () => {
    expect(() => validateWorkspaceName('A')).toThrow('errors.nameTooShort')
  })

  it('throws for an empty string', () => {
    expect(() => validateWorkspaceName('')).toThrow('errors.nameTooShort')
  })

  it('throws for a whitespace-only name', () => {
    // trim().length < 2
    expect(() => validateWorkspaceName('  ')).toThrow('errors.nameTooShort')
  })
})

/* ─── Tests: role hierarchy ─────────────────────────────────────── */

describe('hasPermission (role hierarchy)', () => {
  it('OWNER has the highest rank (4)', () => {
    expect(ROLE_HIERARCHY['OWNER']).toBe(4)
  })

  it('ADMIN < OWNER', () => {
    expect(ROLE_HIERARCHY['ADMIN']).toBeLessThan(ROLE_HIERARCHY['OWNER'])
  })

  it('MEMBER < ADMIN', () => {
    expect(ROLE_HIERARCHY['MEMBER']).toBeLessThan(ROLE_HIERARCHY['ADMIN'])
  })

  it('VIEWER < MEMBER', () => {
    expect(ROLE_HIERARCHY['VIEWER']).toBeLessThan(ROLE_HIERARCHY['MEMBER'])
  })

  it('OWNER can perform ADMIN-level actions', () => {
    expect(hasPermission('OWNER', 'ADMIN')).toBe(true)
  })

  it('ADMIN can perform MEMBER-level actions', () => {
    expect(hasPermission('ADMIN', 'MEMBER')).toBe(true)
  })

  it('MEMBER cannot perform ADMIN-level actions', () => {
    expect(hasPermission('MEMBER', 'ADMIN')).toBe(false)
  })

  it('VIEWER cannot perform MEMBER-level actions', () => {
    expect(hasPermission('VIEWER', 'MEMBER')).toBe(false)
  })

  it('VIEWER can perform VIEWER-level actions', () => {
    expect(hasPermission('VIEWER', 'VIEWER')).toBe(true)
  })
})
