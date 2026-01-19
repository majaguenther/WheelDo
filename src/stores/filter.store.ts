'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Urgency, Effort, TaskStatus } from '@/generated/prisma/client'

interface FilterState {
  // Task list filters
  statusFilter: TaskStatus | 'ALL'
  urgencyFilter: Urgency | 'ALL'
  effortFilter: Effort | 'ALL'
  categoryFilter: string | 'ALL' // categoryId or 'ALL'
  searchQuery: string
  showCompleted: boolean

  // Wheel page filters
  wheelMaxDuration: number | null // in minutes

  // Sort options
  sortBy: 'deadline' | 'urgency' | 'createdAt' | 'position'
  sortOrder: 'asc' | 'desc'

  // Actions
  setStatusFilter: (status: TaskStatus | 'ALL') => void
  setUrgencyFilter: (urgency: Urgency | 'ALL') => void
  setEffortFilter: (effort: Effort | 'ALL') => void
  setCategoryFilter: (categoryId: string | 'ALL') => void
  setSearchQuery: (query: string) => void
  setShowCompleted: (show: boolean) => void
  setWheelMaxDuration: (duration: number | null) => void
  setSortBy: (sortBy: FilterState['sortBy']) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  toggleSortOrder: () => void
  resetFilters: () => void
  resetWheelFilters: () => void
}

const initialFilters = {
  statusFilter: 'ALL' as const,
  urgencyFilter: 'ALL' as const,
  effortFilter: 'ALL' as const,
  categoryFilter: 'ALL' as const,
  searchQuery: '',
  showCompleted: false,
  wheelMaxDuration: null,
  sortBy: 'deadline' as const,
  sortOrder: 'asc' as const,
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...initialFilters,

      setStatusFilter: (status) => set({ statusFilter: status }),
      setUrgencyFilter: (urgency) => set({ urgencyFilter: urgency }),
      setEffortFilter: (effort) => set({ effortFilter: effort }),
      setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowCompleted: (show) => set({ showCompleted: show }),
      setWheelMaxDuration: (duration) => set({ wheelMaxDuration: duration }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      toggleSortOrder: () =>
        set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),

      resetFilters: () =>
        set({
          statusFilter: 'ALL',
          urgencyFilter: 'ALL',
          effortFilter: 'ALL',
          categoryFilter: 'ALL',
          searchQuery: '',
          showCompleted: false,
          sortBy: 'deadline',
          sortOrder: 'asc',
        }),

      resetWheelFilters: () => set({ wheelMaxDuration: null }),
    }),
    {
      name: 'wheeldo-filters',
      partialize: (state) => ({
        // Only persist these filter preferences
        showCompleted: state.showCompleted,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
)

// Selector for getting active filter count (for badges)
export const useActiveFilterCount = () => {
  const filters = useFilterStore()
  let count = 0

  if (filters.statusFilter !== 'ALL') count++
  if (filters.urgencyFilter !== 'ALL') count++
  if (filters.effortFilter !== 'ALL') count++
  if (filters.categoryFilter !== 'ALL') count++
  if (filters.searchQuery) count++

  return count
}
