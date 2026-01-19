'use client'

import { ReactNode, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { useNotificationStore } from '@/stores/notification.store'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { startPolling, stopPolling } = useNotificationStore()

  // Initialize centralized notification polling
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
