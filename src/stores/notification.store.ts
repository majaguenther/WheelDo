'use client'

import { create } from 'zustand'
import type { NotificationDTO } from '@/data/dto/notification.dto'

interface NotificationState {
  notifications: NotificationDTO[]
  unreadCount: number
  isLoading: boolean
  isDropdownOpen: boolean
  lastFetched: Date | null
  isPollingActive: boolean
  pollingIntervalId: ReturnType<typeof setInterval> | null

  // Actions
  setNotifications: (notifications: NotificationDTO[]) => void
  setUnreadCount: (count: number) => void
  setIsLoading: (loading: boolean) => void
  toggleDropdown: () => void
  openDropdown: () => void
  closeDropdown: () => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  reset: () => void

  // Polling actions
  startPolling: () => void
  stopPolling: () => void
  fetchUnreadCount: () => Promise<void>
}

const POLLING_INTERVAL = 30000 // 30 seconds

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,
  lastFetched: null,
  isPollingActive: false,
  pollingIntervalId: null,
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      lastFetched: new Date(),
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  toggleDropdown: () => set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),

  openDropdown: () => set({ isDropdownOpen: true }),

  closeDropdown: () => set({ isDropdownOpen: false }),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId)
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }
    }),

  reset: () => {
    const state = get()
    if (state.pollingIntervalId) {
      clearInterval(state.pollingIntervalId)
    }
    set(initialState)
  },

  fetchUnreadCount: async () => {
    try {
      const res = await fetch('/api/notifications?countOnly=true')
      if (res.ok) {
        const data = await res.json()
        set({ unreadCount: data.count || 0, lastFetched: new Date() })
      }
    } catch {
      // Silently fail
    }
  },

  startPolling: () => {
    const state = get()

    // Prevent multiple polling instances
    if (state.isPollingActive || state.pollingIntervalId) {
      return
    }

    // Fetch immediately
    get().fetchUnreadCount()

    // Set up interval
    const intervalId = setInterval(() => {
      // Only poll if document is visible
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        get().fetchUnreadCount()
      }
    }, POLLING_INTERVAL)

    set({ isPollingActive: true, pollingIntervalId: intervalId })

    // Handle visibility changes
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Fetch when tab becomes visible
          get().fetchUnreadCount()
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  },

  stopPolling: () => {
    const state = get()
    if (state.pollingIntervalId) {
      clearInterval(state.pollingIntervalId)
    }
    set({ isPollingActive: false, pollingIntervalId: null })
  },
}))
