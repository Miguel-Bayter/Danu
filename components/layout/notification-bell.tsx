'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/server/actions/notification.actions'
import type { Notification } from '@prisma/client'
import { APP_LOCALE } from '@/lib/constants'

export function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations('notification')
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  function load() {
    startTransition(async () => {
      const data = await getNotificationsAction()
      setNotifications(data)
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtimeNotifications(userId, load)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const unread = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
        aria-label={t('title')}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 border rounded-xl bg-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('title')}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                {t('markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">{t('empty')}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors hover:bg-accent/50 ${
                    !n.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString(APP_LOCALE)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
