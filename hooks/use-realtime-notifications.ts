'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Subscribes to INSERT events on the Notification table filtered by userId.
 * Calls onNewNotification whenever a new notification arrives.
 * Requires: ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
 */
export function useRealtimeNotifications(userId: string, onNewNotification: () => void) {
  const callbackRef = useRef(onNewNotification)

  useEffect(() => {
    callbackRef.current = onNewNotification
  })

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${userId}`,
        },
        () => {
          callbackRef.current()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
