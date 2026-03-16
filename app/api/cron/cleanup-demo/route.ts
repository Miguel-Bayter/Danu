import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Runs every hour — deletes demo users older than 2 hours
export async function GET(req: Request) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const hasSecret = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (process.env.NODE_ENV === 'production' && !isVercelCron && !hasSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const { count } = await prisma.user.deleteMany({
    where: {
      email: { startsWith: 'demo-', endsWith: '@danu.app' },
      createdAt: { lt: twoHoursAgo },
    },
  })

  return NextResponse.json({ deleted: count })
}
