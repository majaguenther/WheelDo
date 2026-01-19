'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook that triggers a callback when the Escape key is pressed
 */
export function useEscapeKey(callback: () => void, enabled: boolean = true): void {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    },
    [callback]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleEscape, enabled])
}

/**
 * Hook that triggers different callbacks for different keys
 */
export function useKeyboard(
  keyHandlers: Record<string, () => void>,
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const handler = keyHandlers[event.key]
      if (handler) {
        handler()
      }
    },
    [keyHandlers]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}
