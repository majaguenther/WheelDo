'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Hook that triggers a callback when clicking outside the referenced element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    // Delay adding the event listener to prevent immediate triggering
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [callback, enabled])

  return ref
}

/**
 * Hook that triggers a callback when clicking outside multiple elements
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement | null>[],
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    function handleClickOutside(event: MouseEvent) {
      const clickedOutsideAll = refs.every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      )

      if (clickedOutsideAll) {
        callback()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [refs, callback, enabled])
}
