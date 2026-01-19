'use client'

import { useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Users, UserPlus, UserMinus, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { useNotificationStore } from '@/stores/notification.store'
import { markNotificationRead, markAllNotificationsRead } from '@/actions/notifications'
import { Drawer } from '@/components/ui/drawer'

interface NotificationResponse {
  notifications: Array<{
    id: string
    type: 'TASK_SHARED' | 'COLLABORATOR_JOINED' | 'COLLABORATOR_LEFT' | 'TASK_COMPLETED'
    title: string
    message: string
    read: boolean
    createdAt: string
    taskId: string | null
    taskTitle: string | null
  }>
  unreadCount: number
}

export function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isDropdownOpen,
    setNotifications,
    setIsLoading,
    closeDropdown,
    markAsRead,
    markAllAsRead: markAllInStore,
  } = useNotificationStore()

  // Fetcher for full notifications (only when drawer opens)
  const fetchNotifications = useCallback(async (): Promise<NotificationResponse> => {
    const res = await fetch('/api/notifications?limit=10')
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  }, [])

  // Fetch full notifications when drawer opens
  useEffect(() => {
    if (isDropdownOpen) {
      setIsLoading(true)
      fetchNotifications()
        .then((data) => {
          setNotifications(
            data.notifications.map((n) => ({
              ...n,
              createdAt: new Date(n.createdAt),
            }))
          )
        })
        .catch((err) => console.error('Failed to fetch notifications:', err))
        .finally(() => setIsLoading(false))
    }
  }, [isDropdownOpen, fetchNotifications, setNotifications, setIsLoading])

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    markAsRead(notificationId)

    // Server update
    const result = await markNotificationRead(notificationId)
    if (!result.success) {
      console.error('Failed to mark as read:', result.error)
    }
  }

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    markAllInStore()

    // Server update
    const result = await markAllNotificationsRead()
    if (!result.success) {
      console.error('Failed to mark all as read:', result.error)
    }
  }

  const getIcon = (type: 'TASK_SHARED' | 'COLLABORATOR_JOINED' | 'COLLABORATOR_LEFT' | 'TASK_COMPLETED') => {
    switch (type) {
      case 'TASK_SHARED':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'COLLABORATOR_JOINED':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'COLLABORATOR_LEFT':
        return <UserMinus className="h-4 w-4 text-orange-500" />
      case 'TASK_COMPLETED':
        return <PartyPopper className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <Drawer isOpen={isDropdownOpen} onClose={closeDropdown} title="Notifications">
      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b">
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className="divide-y">
        {isLoading ? (
          <div className="px-4 py-12 text-center text-muted-foreground text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'px-4 py-3 hover:bg-secondary/50 transition-colors',
                !notification.read && 'bg-primary/5'
              )}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-shrink-0 p-1 hover:bg-secondary rounded"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                    {notification.taskId && (
                      <Link
                        href={`/tasks/${notification.taskId}`}
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id)
                          }
                          closeDropdown()
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        View task
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  )
}
