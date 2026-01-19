'use client'

import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Effort } from '@/generated/prisma/client'

const effortOptions: { value: Effort; label: string; count: number }[] = [
  { value: 'MINIMAL', label: 'Minimal', count: 1 },
  { value: 'LOW', label: 'Low', count: 2 },
  { value: 'MODERATE', label: 'Moderate', count: 3 },
  { value: 'HIGH', label: 'High', count: 4 },
  { value: 'EXTREME', label: 'Extreme', count: 5 },
]

interface EffortSelectorProps {
  value: Effort
  onChange: (value: Effort) => void
  disabled?: boolean
}

export function EffortSelector({ value, onChange, disabled = false }: EffortSelectorProps) {
  return (
    <div className="flex gap-1">
      {effortOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={cn(
            'flex-1 px-2 py-2 text-sm rounded-lg border transition-colors flex flex-col items-center gap-1',
            value === opt.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:bg-secondary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={opt.label}
        >
          <div className="flex gap-0.5">
            {Array.from({ length: opt.count }).map((_, i) => (
              <Zap
                key={i}
                className={cn(
                  'h-3 w-3',
                  value === opt.value
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-muted-foreground'
                )}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
