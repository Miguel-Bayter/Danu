'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell, CheckCheck, UserPlus, FolderPlus, FolderX,
  LayoutGrid, LayoutGridIcon, Clock, AlertCircle, Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  deleteNotificationAction,
} from '@/server/actions/notification.actions'
import type { Notification, NotificationType } from '@prisma/client'
import { APP_LOCALE } from '@/lib/constants'

type NotifMeta = {
  key: string
  Icon: React.ElementType
  iconCls: string
}

const TYPE_META: Partial<Record<NotificationType, NotifMeta>> = {
  TASK_ASSIGNED:     { key: 'taskAssigned',     Icon: CheckCheck,      iconCls: 'text-primary bg-primary/12'        },
  TASK_DUE_SOON:    { key: 'taskDueSoon',      Icon: Clock,           iconCls: 'text-amber-500 bg-amber-500/12'   },
  TASK_OVERDUE:     { key: 'taskOverdue',      Icon: AlertCircle,     iconCls: 'text-red-500 bg-red-500/12'       },
  PROJECT_CREATED:  { key: 'projectCreated',   Icon: FolderPlus,      iconCls: 'text-emerald-500 bg-emerald-500/12' },
  PROJECT_DELETED:  { key: 'projectDeleted',   Icon: FolderX,         iconCls: 'text-red-500 bg-red-500/12'       },
  WORKSPACE_CREATED:{ key: 'workspaceCreated', Icon: LayoutGrid,      iconCls: 'text-primary bg-primary/12'       },
  WORKSPACE_DELETED:{ key: 'workspaceDeleted', Icon: LayoutGridIcon,  iconCls: 'text-red-500 bg-red-500/12'       },
  MEMBER_JOINED:    { key: 'memberJoined',     Icon: UserPlus,        iconCls: 'text-sky-500 bg-sky-500/12'       },
}

function relativeTime(date: Date, locale: string): string {
  const diff = Date.now() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return locale.startsWith('es') ? 'ahora'         : 'just now'
  if (mins < 60)  return locale.startsWith('es') ? `hace ${mins}m` : `${mins}m ago`
  if (hours < 24) return locale.startsWith('es') ? `hace ${hours}h`: `${hours}h ago`
  if (days < 7)   return locale.startsWith('es') ? `hace ${days}d` : `${days}d ago`
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations('notification')
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, startTransition] = useTransition()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef  = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  function load() {
    startTransition(async () => {
      const data = await getNotificationsAction()
      setNotifications(data)
    })
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useRealtimeNotifications(userId, load)

  function updatePosition() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPanelStyle({
      position: 'fixed',
      bottom: window.innerHeight - r.top + 8,
      left: r.left,
      zIndex: 9999,
    })
  }

  function handleOpen() {
    if (!open) updatePosition()
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    function onClose(e: MouseEvent) {
      if (
        panelRef.current   && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    function onScroll() { updatePosition() }
    document.addEventListener('mousedown', onClose)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onClose)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const unread = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await deleteNotificationAction(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="w-80 border border-border/70 rounded-2xl bg-card shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t('title')}
          </span>
          {unread > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white leading-none">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-primary hover:text-primary/70 font-semibold transition-colors"
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-border/30">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-[12px] text-muted-foreground/60">{t('empty')}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type]
            const Icon = meta?.Icon ?? Bell
            const iconCls = meta?.iconCls ?? 'text-muted-foreground bg-muted'
            const label = meta?.key
              ? t(meta.key as Parameters<typeof t>[0])
              : n.title

            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleMarkRead(n.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleMarkRead(n.id)}
                className={`w-full text-left px-4 py-3 transition-colors group cursor-pointer
                            hover:bg-accent/60 relative
                            ${!n.read ? 'bg-primary/[0.035]' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[12.5px] leading-snug ${!n.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                        {label}
                      </p>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {relativeTime(new Date(n.createdAt), APP_LOCALE)}
                    </p>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleDelete(e as unknown as React.MouseEvent, n.id) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(e as unknown as React.MouseEvent, n.id) } }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                               w-6 h-6 flex items-center justify-center rounded-md
                               text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="relative p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
        aria-label={t('title')}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white
                           text-[10px] rounded-full flex items-center justify-center
                           font-black leading-none animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {typeof window !== 'undefined' && createPortal(panel, document.body)}
    </>
  )
}
