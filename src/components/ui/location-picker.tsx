'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  GeoapifyContext,
  GeoapifyGeocoderAutocomplete,
} from '@geoapify/react-geocoder-autocomplete'
import { MapPin, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocationData, GeoapifyFeature } from '@/types/location'
import { extractLocationData } from '@/types/location'

interface LocationPickerProps {
  value: LocationData | null
  onChange: (value: LocationData | null) => void
  placeholder?: string
  className?: string
}

export function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location or place...',
  className,
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
  const geocoderRef = useRef<{ clear?: () => void } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Insert comma separator spans between main-part and secondary-part
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new MutationObserver(() => {
      const items = containerRef.current?.querySelectorAll(
        '.geoapify-autocomplete-item .address'
      )
      items?.forEach((address) => {
        const mainPart = address.querySelector('.main-part')
        const secondaryPart = address.querySelector('.secondary-part')

        // Only add comma if both parts exist and comma not already added
        if (mainPart && secondaryPart && !address.querySelector('.comma-separator')) {
          const comma = document.createElement('span')
          comma.className = 'comma-separator'
          comma.textContent = ', '
          address.insertBefore(comma, secondaryPart)
        }
      })
    })

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  const handlePlaceSelect = useCallback(
    (feature: GeoapifyFeature | null) => {
      const data = extractLocationData(feature)
      onChange(data.formatted ? data : null)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange(null)
    // Try to clear the input using the ref
    if (geocoderRef.current?.clear) {
      geocoderRef.current.clear()
    }
  }, [onChange])

  // Track when we have a value to show clear button
  const hasValue = !!value?.formatted

  if (!apiKey) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Location API not configured"
            disabled
            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
          />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative location-picker', className)}>
      <GeoapifyContext apiKey={apiKey}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <GeoapifyGeocoderAutocomplete
            placeholder={placeholder}
            value={value?.formatted || ''}
            placeSelect={handlePlaceSelect}
            suggestionsChange={() => setIsLoading(false)}
            limit={5}
            debounceDelay={300}
          />
          {hasValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-secondary z-10"
              aria-label="Clear location"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-10" />
          )}
        </div>
      </GeoapifyContext>
    </div>
  )
}
