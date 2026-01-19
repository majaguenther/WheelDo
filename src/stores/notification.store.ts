'use client'

import { create } from 'zustand'
import type { NotificationDTO } from '@/data/notifications'

interface NotificationState {
  notifications: NotificationDTO[]
  unreadCount: number
  isLoading: boolean
  isDropdownOpen: boolean
  lastFetched: Date | null

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
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,
  lastFetched: null,
}

export const useNotificationStore = create<NotificationState>((set) => ({
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

  reset: () => set(initialState),
}))
