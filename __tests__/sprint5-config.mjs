import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

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

console.log('\nNotification repository:')
const notifRepo = readFileSync(join(root, 'server/repositories/notification.repository.ts'), 'utf8')
test('findByUser method', notifRepo.includes('findByUser'), true)
test('countUnread method', notifRepo.includes('countUnread'), true)
test('create method', notifRepo.includes('NotificationType'), true)
test('markRead method', notifRepo.includes('markRead'), true)
test('markAllRead method', notifRepo.includes('markAllRead'), true)

console.log('\nNotification bell component:')
const bell = readFileSync(join(root, 'components/layout/notification-bell.tsx'), 'utf8')
test('Bell icon from lucide-react', bell.includes("from 'lucide-react'"), true)
test('useRealtimeNotifications hook', bell.includes('useRealtimeNotifications'), true)
test('markAllNotificationsReadAction', bell.includes('markAllNotificationsReadAction'), true)
test('unread badge count', bell.includes('unread > 0'), true)
test('click-outside handler', bell.includes('mousedown'), true)

console.log('\nSidebar integration:')
const sidebar = readFileSync(join(root, 'components/layout/sidebar.tsx'), 'utf8')
test('NotificationBell imported', sidebar.includes('NotificationBell'), true)
test('userId passed to bell', sidebar.includes('userId={user.id}'), true)
test('user.id in SidebarProps', sidebar.includes('id: string'), true)

console.log('\nCron jobs:')
const cronDueSoon = readFileSync(join(root, 'app/api/cron/due-soon/route.ts'), 'utf8')
test('due-soon creates TASK_DUE_SOON notification', cronDueSoon.includes('TASK_DUE_SOON'), true)
test('due-soon checks x-vercel-cron header', cronDueSoon.includes('x-vercel-cron'), true)
test('due-soon uses findDueSoon(24)', cronDueSoon.includes('findDueSoon(24)'), true)

const cronOverdue = readFileSync(join(root, 'app/api/cron/overdue/route.ts'), 'utf8')
test('overdue creates TASK_OVERDUE notification', cronOverdue.includes('TASK_OVERDUE'), true)
test('overdue uses findOverdue()', cronOverdue.includes('findOverdue()'), true)

console.log('\nVercel cron schedule:')
const vercelJson = readFileSync(join(root, 'vercel.json'), 'utf8')
test('vercel.json has crons array', vercelJson.includes('"crons"'), true)
test('due-soon scheduled daily', vercelJson.includes('/api/cron/due-soon'), true)
test('overdue scheduled daily', vercelJson.includes('/api/cron/overdue'), true)

console.log('\nTeam Health Score:')
const taskRepo = readFileSync(join(root, 'server/repositories/task.repository.ts'), 'utf8')
test('getHealthScore method', taskRepo.includes('getHealthScore'), true)
test('completionRate calculation', taskRepo.includes('completionRate'), true)
test('overduePenalty calculation', taskRepo.includes('overduePenalty'), true)
test('score clamped 0-100', taskRepo.includes('Math.max(0, Math.min(100'), true)

const workspacePage = readFileSync(join(root, 'app/dashboard/[slug]/page.tsx'), 'utf8')
test('getHealthScore called in workspace page', workspacePage.includes('getHealthScore'), true)
test('HealthScore progress bar', workspacePage.includes("width: `${healthScore.score}%`"), true)
test('healthScoreLabel helper', workspacePage.includes('healthScoreLabel'), true)

console.log('\nEmail invitations:')
const inviteService = readFileSync(join(root, 'server/services/invitation.service.ts'), 'utf8')
test('assertMemberRole ADMIN required', inviteService.includes('WorkspaceRole.ADMIN'), true)
test('invitationRepository.upsert called', inviteService.includes('upsert'), true)
test('resend.emails.send called', inviteService.includes('resend.emails.send'), true)
test('7-day expiry in repository', readFileSync(join(root, 'server/repositories/invitation.repository.ts'), 'utf8').includes('SEVEN_DAYS_MS'), true)

const inviteSchema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8')
test('WorkspaceInvitation model in schema', inviteSchema.includes('WorkspaceInvitation'), true)
test('token unique index', inviteSchema.includes('@unique @default(cuid())'), true)
test('workspaceId_email unique compound', inviteSchema.includes('@@unique([workspaceId, email])'), true)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
