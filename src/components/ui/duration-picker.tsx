'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface DurationPickerProps {
  value: number | null
  onChange: (minutes: number | null) => void
  className?: string
}

type TabType = 'minutes' | 'hours'

const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45]
const HOUR_PRESETS = [60, 90, 120, 180, 240, 300, 360] // stored as minutes

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = minutes / 60
  if (Number.isInteger(hours)) {
    return `${hours}h`
  }
  return `${hours}h`
}

function getPresetLabel(minutes: number, tab: TabType): string {
  if (tab === 'minutes') {
    return `${minutes} min`
  }
  const hours = minutes / 60
  if (Number.isInteger(hours)) {
    return `${hours}h`
  }
  return `${hours}h`
}

export function DurationPicker({
  value,
  onChange,
  className,
}: DurationPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Initialize tab based on current value
    if (value && value >= 60) return 'hours'
    return 'minutes'
  })
  const [showCustom, setShowCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const presets = activeTab === 'minutes' ? MINUTE_PRESETS : HOUR_PRESETS

  const handlePresetClick = (preset: number) => {
    if (value === preset) {
      onChange(null)
    } else {
      onChange(preset)
    }
    setCustomValue('')
    setShowCustom(false)
  }

  const handleCustomChange = (inputValue: string) => {
    setCustomValue(inputValue)
    const num = parseInt(inputValue, 10)
    if (!isNaN(num) && num > 0) {
      const minutes = activeTab === 'minutes' ? num : num * 60
      onChange(minutes)
    }
  }

  const handleClear = () => {
    onChange(null)
    setCustomValue('')
    setShowCustom(false)
  }

  const isPresetSelected = (preset: number) => value === preset

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tab Toggle */}
      <div
        className="flex rounded-lg border bg-secondary/50 p-1"
        role="tablist"
        aria-label="Duration unit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'minutes'}
          onClick={() => setActiveTab('minutes')}
          className={cn(
            'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'minutes'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Minutes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hours'}
          onClick={() => setActiveTab('hours')}
          className={cn(
            'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'hours'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Hours
        </button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={isPresetSelected(preset)}
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'min-h-[44px] px-3 py-2.5 text-sm rounded-lg border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isPresetSelected(preset)
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:bg-secondary'
            )}
          >
            {getPresetLabel(preset, activeTab)}
          </button>
        ))}
      </div>

      {/* Custom Input Toggle */}
      <button
        type="button"
        onClick={() => setShowCustom(!showCustom)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showCustom ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Enter custom duration
      </button>

      {/* Custom Input Section */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={activeTab === 'minutes' ? '25' : '2'}
            min="1"
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground min-w-[40px]">
            {activeTab === 'minutes' ? 'min' : 'hours'}
          </span>
        </div>
      )}

      {/* Clear Selection */}
      {value !== null && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Clear selection
          <span className="text-xs opacity-70">({formatDuration(value)})</span>
        </button>
      )}
    </div>
  )
}
