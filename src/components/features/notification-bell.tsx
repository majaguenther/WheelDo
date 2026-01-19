'use client'

import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/stores/notification.store'

export function NotificationBell() {
  const { unreadCount, openDropdown } = useNotificationStore()

  return (
    <button
      onClick={openDropdown}
      className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
