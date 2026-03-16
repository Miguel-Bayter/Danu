'use server'

import { requireAuth } from '@/server/lib/auth'
import { prisma } from '@/lib/prisma'
import { seedDemoWorkspace } from '@/server/services/demo-seed.service'
import { seedOnboardingWorkspace } from '@/server/services/onboarding-seed.service'

/**
 * Called on every dashboard load — runs once per new user.
 *
 * Demo users  (demo-*@danu.app) → full Acme Corp seed (3 projects, 16 tasks)
 * Real users  (GitHub OAuth)    → lightweight onboarding workspace (1 project, 4 tasks)
 * Returning users               → skipped immediately
 */
export async function maybeSeeDemoAction(): Promise<void> {
  const userId = await requireAuth()

  const [memberCount, user] = await Promise.all([
    prisma.workspaceMember.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ])

  if (memberCount > 0) return // already has workspaces — skip

  const isDemo = user?.email?.startsWith('demo-') && user.email.endsWith('@danu.app')

  if (isDemo) {
    await seedDemoWorkspace(userId)
  } else {
    await seedOnboardingWorkspace(userId)
  }
}
