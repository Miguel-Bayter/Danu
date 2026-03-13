'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Subscribes to INSERT / UPDATE / DELETE events on the Task table
 * filtered by projectId. On any change, triggers a Next.js router.refresh()
 * so the server component re-fetches and the board updates automatically.
 */
export function useRealtimeTasks(projectId: string) {
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Task',
          filter: `projectId=eq.${projectId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, router])
}
