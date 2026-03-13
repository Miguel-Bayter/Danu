'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/server/lib/auth'
import { notificationRepository } from '@/server/repositories/notification.repository'

export async function getNotificationsAction() {
  const userId = await requireAuth()
  return notificationRepository.findByUser(userId)
}

export async function markNotificationReadAction(id: string) {
  const userId = await requireAuth()
  await notificationRepository.markRead(id, userId)
  revalidatePath('/dashboard', 'layout')
}

export async function markAllNotificationsReadAction() {
  const userId = await requireAuth()
  await notificationRepository.markAllRead(userId)
  revalidatePath('/dashboard', 'layout')
}

export async function deleteNotificationAction(id: string) {
  const userId = await requireAuth()
  await notificationRepository.deleteOne(id, userId)
  revalidatePath('/dashboard', 'layout')
}
