'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UsePollingOptions {
  /** Polling interval in milliseconds */
  interval: number
  /** Whether polling is enabled */
  enabled?: boolean
  /** Pause polling when page is not visible */
  pauseOnHidden?: boolean
  /** Immediate first fetch on mount */
  immediate?: boolean
  /** Error retry count before stopping */
  maxRetries?: number
}

interface UsePollingResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refresh: () => Promise<void>
}

/**
 * Smart polling hook with visibility awareness and request deduplication
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions
): UsePollingResult<T> {
  const {
    interval,
    enabled = true,
    pauseOnHidden = true,
    immediate = true,
    maxRetries = 3,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const retryCount = useRef(0)
  const isPolling = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    // Prevent concurrent requests
    if (isPolling.current) return

    isPolling.current = true
    setIsLoading(true)

    try {
      const result = await fetcher()
      setData(result)
      setError(null)
      retryCount.current = 0
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      retryCount.current++

      if (retryCount.current >= maxRetries) {
        console.error(`Polling stopped after ${maxRetries} retries:`, error)
      }
    } finally {
      isPolling.current = false
      setIsLoading(false)
    }
  }, [fetcher, maxRetries])

  const refresh = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!enabled || retryCount.current >= maxRetries) return

    // Immediate fetch on mount
    if (immediate) {
      fetchData()
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      // Check visibility if pauseOnHidden is enabled
      if (pauseOnHidden && document.hidden) return

      fetchData()
    }, interval)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!pauseOnHidden) return

      if (document.hidden) {
        // Pause polling when hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Resume polling and fetch immediately when visible
        fetchData()
        intervalRef.current = setInterval(fetchData, interval)
      }
    }

    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [enabled, interval, immediate, pauseOnHidden, maxRetries, fetchData])

  return { data, error, isLoading, refresh }
}

/**
 * Simplified notification polling hook
 */
export function useNotificationPolling(
  fetcher: () => Promise<{ notifications: unknown[]; unreadCount: number }>,
  interval: number = 30000 // Default 30 seconds
) {
  return usePolling(fetcher, {
    interval,
    enabled: true,
    pauseOnHidden: true,
    immediate: true,
    maxRetries: 5,
  })
}
