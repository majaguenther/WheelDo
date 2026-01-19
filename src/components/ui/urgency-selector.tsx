'use client'

import { cn } from '@/lib/utils'
import type { Urgency } from '@/generated/prisma/client'

const urgencyOptions: { value: Urgency; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-red-500' },
]

interface UrgencySelectorProps {
  value: Urgency
  onChange: (value: Urgency) => void
  disabled?: boolean
}

export function UrgencySelector({ value, onChange, disabled = false }: UrgencySelectorProps) {
  return (
    <div className="flex gap-2">
      {urgencyOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={cn(
            'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-secondary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={opt.color}>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
