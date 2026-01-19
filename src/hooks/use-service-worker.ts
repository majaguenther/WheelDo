'use client'

import { useEffect, useState, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isReady: boolean
  registration: ServiceWorkerRegistration | null
  error: Error | null
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  update: () => Promise<void>
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isReady: false,
    registration: null,
    error: null,
  })

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setState((prev) => ({ ...prev, isSupported: false }))
      return
    }

    setState((prev) => ({ ...prev, isSupported: true }))

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }))

        // Check if service worker is ready
        const ready = await navigator.serviceWorker.ready
        setState((prev) => ({
          ...prev,
          isReady: true,
          registration: ready,
        }))

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                console.log('[SW] New service worker available')
              }
            })
          }
        })
      } catch (error) {
        console.error('[SW] Registration failed:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Registration failed'),
        }))
      }
    }

    registerServiceWorker()
  }, [])

  const update = useCallback(async () => {
    if (state.registration) {
      try {
        await state.registration.update()
      } catch (error) {
        console.error('[SW] Update failed:', error)
      }
    }
  }, [state.registration])

  return {
    ...state,
    update,
  }
}
