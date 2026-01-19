'use client'

import { useEffect, useRef } from 'react'
import { useNotificationStore } from '@/stores/notification.store'
import { NotificationDrawer } from '@/components/features/notification-drawer'

interface NotificationProviderProps {
  userId: string
}

/**
 * Singleton notification provider that initializes polling once
 * and persists across page navigations
 */
export function NotificationProvider({ userId }: NotificationProviderProps) {
  const { startPolling, stopPolling } = useNotificationStore()
  const initializedRef = useRef(false)

  useEffect(() => {
    // Only initialize once per mount
    if (initializedRef.current) return
    initializedRef.current = true

    startPolling()

    return () => {
      stopPolling()
      initializedRef.current = false
    }
  }, [startPolling, stopPolling])

  return <NotificationDrawer />
}
