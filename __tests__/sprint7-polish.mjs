// Sprint 7 — Dark mode, responsive, tests, CI/CD

import fs from 'fs'
import path from 'path'

let pass = 0
let fail = 0

function test(name, result, expected) {
  if (result === expected) {
    console.log(`  ✓ ${name}`)
    pass++
  } else {
    console.log(`  ✗ ${name} — got "${result}", expected "${expected}"`)
    fail++
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.resolve(process.cwd(), relPath))
}

function fileContains(relPath, substring) {
  if (!fileExists(relPath)) return false
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8').includes(substring)
}

function parseJson(relPath) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8'))
}

// ─── T1: Dark mode ────────────────────────────────────────────────────────────

console.log('\nT1 — Dark mode:')

test(
  'ThemeProvider component exists',
  fileExists('components/layout/theme-provider.tsx'),
  true,
)
test(
  'ThemeToggle component exists',
  fileExists('components/layout/theme-toggle.tsx'),
  true,
)
test(
  'ThemeProvider uses next-themes',
  fileContains('components/layout/theme-provider.tsx', 'next-themes'),
  true,
)
test(
  'ThemeToggle uses useTheme hook',
  fileContains('components/layout/theme-toggle.tsx', 'useTheme'),
  true,
)
test(
  'Root layout has suppressHydrationWarning',
  fileContains('app/layout.tsx', 'suppressHydrationWarning'),
  true,
)
test(
  'Root layout uses ThemeProvider',
  fileContains('app/layout.tsx', 'ThemeProvider'),
  true,
)
test(
  'globals.css defines .dark CSS variables',
  fileContains('app/globals.css', '.dark'),
  true,
)
test(
  'globals.css has dark custom-variant',
  fileContains('app/globals.css', '@custom-variant dark'),
  true,
)

// ─── T2: Responsive ───────────────────────────────────────────────────────────

console.log('\nT2 — Responsive layout:')

test(
  'DashboardShell component exists',
  fileExists('components/layout/dashboard-shell.tsx'),
  true,
)
test(
  'DashboardShell renders mobile menu button',
  fileContains('components/layout/dashboard-shell.tsx', 'Menu'),
  true,
)
test(
  'DashboardShell hides desktop sidebar on mobile (md:flex)',
  fileContains('components/layout/dashboard-shell.tsx', 'md:flex'),
  true,
)
test(
  'Dashboard layout uses DashboardShell',
  fileContains('app/dashboard/layout.tsx', 'DashboardShell'),
  true,
)
test(
  'Workspace page uses responsive padding',
  fileContains('app/dashboard/[slug]/page.tsx', 'p-4'),
  true,
)

// ─── T3: i18n completeness ────────────────────────────────────────────────────

console.log('\nT3 — i18n key completeness:')

function flattenKeys(obj, prefix = '') {
  return Object.keys(obj).flatMap((key) => {
    const full = prefix ? `${prefix}.${key}` : key
    return typeof obj[key] === 'object' && obj[key] !== null
      ? flattenKeys(obj[key], full)
      : [full]
  })
}

const es = parseJson('messages/es.json')
const en = parseJson('messages/en.json')
const esKeys = new Set(flattenKeys(es))
const enKeys = new Set(flattenKeys(en))

const missingInEn = [...esKeys].filter((k) => !enKeys.has(k))
const missingInEs = [...enKeys].filter((k) => !esKeys.has(k))

test('en.json has all keys present in es.json', missingInEn.length, 0)
test('es.json has all keys present in en.json', missingInEs.length, 0)

if (missingInEn.length > 0) {
  console.log(`    Missing in en.json: ${missingInEn.slice(0, 5).join(', ')}`)
}
if (missingInEs.length > 0) {
  console.log(`    Missing in es.json: ${missingInEs.slice(0, 5).join(', ')}`)
}

// Spot-check critical Sprint 7 keys
test('es.json has sidebar.myWorkspaces', esKeys.has('sidebar.myWorkspaces'), true)
test('en.json has sidebar.myWorkspaces', enKeys.has('sidebar.myWorkspaces'), true)
test('es.json has invite.invalidTitle', esKeys.has('invite.invalidTitle'), true)
test('en.json has invite.invalidTitle', enKeys.has('invite.invalidTitle'), true)
test('es.json has notification.taskAssigned', esKeys.has('notification.taskAssigned'), true)
test('en.json has notification.taskAssigned', enKeys.has('notification.taskAssigned'), true)
test('es.json has report.pdfTitle', esKeys.has('report.pdfTitle'), true)
test('en.json has report.pdfTitle', enKeys.has('report.pdfTitle'), true)

// ─── T4: CI/CD ────────────────────────────────────────────────────────────────

console.log('\nT4 — CI/CD:')

test(
  'GitHub Actions workflow file exists',
  fileExists('.github/workflows/ci.yml'),
  true,
)
test(
  'CI workflow runs on push to master',
  fileContains('.github/workflows/ci.yml', "branches: [master]"),
  true,
)
test(
  'CI workflow has typecheck step',
  fileContains('.github/workflows/ci.yml', 'tsc --noEmit'),
  true,
)
test(
  'CI workflow has test step',
  fileContains('.github/workflows/ci.yml', 'test:run'),
  true,
)
test(
  'CI workflow has build step',
  fileContains('.github/workflows/ci.yml', 'npm run build'),
  true,
)

// ─── Architecture ─────────────────────────────────────────────────────────────

console.log('\nArchitecture compliance:')

test(
  'invite page uses action (not service directly)',
  fileContains('app/invite/[token]/page.tsx', 'acceptInvitationAction'),
  true,
)
test(
  'invitation service does NOT import workspace.service',
  fileContains('server/services/invitation.service.ts', "from '@/server/services/workspace.service'"),
  false,
)
test(
  'task actions use i18n key for notification title (no hardcoded Spanish)',
  fileContains('server/actions/task.actions.ts', 'Nueva tarea'),
  false,
)
test(
  'locale action exists',
  fileExists('server/actions/locale.actions.ts'),
  true,
)
test(
  'delete workspace button exists',
  fileExists('components/workspace/delete-workspace-button.tsx'),
  true,
)

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
console.log(`Sprint 7 results: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
