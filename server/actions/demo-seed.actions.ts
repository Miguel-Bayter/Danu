'use server'

import { requireAuth } from '@/server/lib/auth'
import { prisma } from '@/lib/prisma'
import { seedDemoWorkspace } from '@/server/services/demo-seed.service'

/**
 * Seeds a demo workspace for first-time users.
 * Safe to call on every dashboard load — checks count first.
 */
export async function maybeSeeDemoAction(): Promise<void> {
  const userId = await requireAuth()

  const count = await prisma.workspaceMember.count({ where: { userId } })
  if (count > 0) return // already has workspaces — skip

  await seedDemoWorkspace(userId)
}
