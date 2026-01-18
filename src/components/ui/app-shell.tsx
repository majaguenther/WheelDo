'use client'

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
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
