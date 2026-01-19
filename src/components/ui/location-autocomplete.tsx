'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/use-click-outside'

interface GeoapifyResult {
  properties: {
    formatted: string
    address_line1?: string
    address_line2?: string
    city?: string
    country?: string
    lat: number
    lon: number
    place_id: string
  }
}

interface GeoapifyResponse {
  features: GeoapifyResult[]
}

export interface LocationValue {
  formatted: string
  address_line1?: string
  address_line2?: string
  city?: string
  country?: string
  lat: number
  lon: number
  place_id: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<LocationValue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationValue | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Use click outside hook to close dropdown
  const containerRef = useClickOutside<HTMLDivElement>(
    () => setIsFocused(false),
    isFocused
  )

  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

  // Parse initial value if it's JSON
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value) as LocationValue
        setSelectedLocation(parsed)
        setInputValue(parsed.formatted || '')
      } catch {
        // If parsing fails, treat as plain text
        setInputValue(value)
      }
    }
  }, [])


  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !apiKey) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5`
      )
      const data: GeoapifyResponse = await response.json()

      const locations: LocationValue[] = data.features.map((feature) => ({
        formatted: feature.properties.formatted,
        address_line1: feature.properties.address_line1,
        address_line2: feature.properties.address_line2,
        city: feature.properties.city,
        country: feature.properties.country,
        lat: feature.properties.lat,
        lon: feature.properties.lon,
        place_id: feature.properties.place_id,
      }))

      setSuggestions(locations)
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedLocation(null)

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleSelectLocation = (location: LocationValue) => {
    setSelectedLocation(location)
    setInputValue(location.formatted)
    setSuggestions([])
    setIsFocused(false)

    // Store as JSON string
    onChange(JSON.stringify(location))
  }

  const handleClear = () => {
    setInputValue('')
    setSelectedLocation(null)
    setSuggestions([])
    onChange('')
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Small delay to allow click on suggestion to register
    setTimeout(() => {
      if (!selectedLocation && inputValue) {
        // If user entered text but didn't select, save as plain text
        onChange(inputValue)
      }
    }, 200)
  }

  const showDropdown = isFocused && (suggestions.length > 0 || isLoading)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-9 pr-10 appearance-none"
          style={{ WebkitAppearance: 'none' }}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-secondary z-10 touch-manipulation"
            aria-label="Clear location"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto">
              {suggestions.map((location, index) => (
                <li key={location.place_id || index}>
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(location)}
                    className="w-full px-3 py-2 text-left hover:bg-secondary transition-colors flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {location.address_line1 || location.formatted.split(',')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.address_line2 || location.formatted}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
