'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const DURATION_OPTIONS = [
  { value: undefined, label: 'Any' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
] as const

interface DurationFilterProps {
  currentValue?: number
}

export function DurationFilter({ currentValue }: DurationFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: number | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === undefined) {
      params.delete('maxDuration')
    } else {
      params.set('maxDuration', value.toString())
    }

    startTransition(() => {
      router.push(`/wheel?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>I have time for:</span>
      </div>
      <div
        className={cn('flex flex-wrap justify-center gap-2', isPending && 'opacity-50')}
        role="group"
        aria-label="Duration filter"
      >
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => handleChange(option.value)}
            disabled={isPending}
            aria-pressed={currentValue === option.value}
            className={cn(
              'px-4 py-2 text-sm rounded-full border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              currentValue === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-secondary'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
