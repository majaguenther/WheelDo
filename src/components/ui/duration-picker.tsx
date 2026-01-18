'use client'

import {useState, useCallback, useMemo} from 'react'
import {ChevronDown, ChevronUp, X} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Input} from '@/components/ui/input'

interface DurationPickerProps {
    value: number | null
    onChange: (minutes: number | null) => void
    className?: string
}

type TabType = 'minutes' | 'hours'

// Presets stored as minutes - 6 each for a perfect 3-column grid
const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45] as const
const HOUR_PRESETS = [60, 120, 180, 240, 300, 360] as const // 1h, 2h, 3h, 4h, 5h, 6h

const ALL_PRESETS: Set<number> = new Set([...MINUTE_PRESETS, ...HOUR_PRESETS])

/**
 * Formats duration in minutes to a human-readable string.
 * Examples: 30 -> "30 min", 60 -> "1h", 90 -> "1.5h"
 */
function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`
    }
    const hours = minutes / 60
    if (Number.isInteger(hours)) {
        return `${hours}h`
    }
    return `${parseFloat(hours.toFixed(1))}h`
}

/**
 * Determines the appropriate tab based on a duration value.
 */
function getTabForValue(value: number | null): TabType {
    if (value === null) return 'minutes'
    // If value is an hour preset or >= 60, show hours tab
    if (HOUR_PRESETS.includes(value as typeof HOUR_PRESETS[number])) {
        return 'hours'
    }
    return value >= 60 ? 'hours' : 'minutes'
}

export function DurationPicker({
                                   value,
                                   onChange,
                                   className,
                               }: DurationPickerProps) {
    // Tab state - initialize based on current value
    const [activeTab, setActiveTab] = useState<TabType>(() => getTabForValue(value))
    const [showCustom, setShowCustom] = useState(false)
    const [customInput, setCustomInput] = useState('')

    // Get presets for current tab
    const presets = activeTab === 'minutes' ? MINUTE_PRESETS : HOUR_PRESETS

    // Check if value matches a preset (used to determine if custom input should show value)
    const isCustomValue = useMemo(() => {
        return value !== null && !ALL_PRESETS.has(value)
    }, [value])

    // Handle preset button click
    const handlePresetClick = useCallback((preset: number) => {
        if (value === preset) {
            // Clicking already-selected preset clears it
            onChange(null)
        } else {
            onChange(preset)
        }
        // Always clear custom input when interacting with presets
        setCustomInput('')
        setShowCustom(false)
    }, [value, onChange])

    // Handle tab change
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab)
        setCustomInput('')
    }, [])

    // Handle custom input change
    const handleCustomInputChange = useCallback((inputValue: string) => {
        setCustomInput(inputValue)

        // Don't update value for empty or invalid input
        if (inputValue === '' || inputValue === '-') {
            return
        }

        const num = parseFloat(inputValue)
        if (!isNaN(num) && num > 0) {
            // Convert to minutes based on active tab
            const minutes = activeTab === 'minutes'
                ? Math.round(num)
                : Math.round(num * 60)

            // Validate: must be positive and not exceed reasonable limits
            if (minutes > 0 && minutes <= 1440) { // Max 24 hours
                onChange(minutes)
            }
        }
    }, [activeTab, onChange])

    // Handle clearing the selection
    const handleClear = useCallback(() => {
        onChange(null)
        setCustomInput('')
        setShowCustom(false)
    }, [onChange])

    // Get label for a preset button
    const getPresetLabel = useCallback((preset: number): string => {
        if (activeTab === 'minutes') {
            return `${preset} min`
        }
        const hours = preset / 60
        return Number.isInteger(hours) ? `${hours}h` : `${hours}h`
    }, [activeTab])

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
                    id="duration-tab-minutes"
                    aria-selected={activeTab === 'minutes'}
                    aria-controls="duration-panel-minutes"
                    onClick={() => handleTabChange('minutes')}
                    className={cn(
                        'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                    id="duration-tab-hours"
                    aria-selected={activeTab === 'hours'}
                    aria-controls="duration-panel-hours"
                    onClick={() => handleTabChange('hours')}
                    className={cn(
                        'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        activeTab === 'hours'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    Hours
                </button>
            </div>

            {/* Preset Grid */}
            <div
                id={`duration-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`duration-tab-${activeTab}`}
                className="grid grid-cols-3 gap-2"
            >
                {presets.map((preset) => {
                    const isSelected = value === preset
                    return (
                        <button
                            key={preset}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                                'min-h-[44px] px-3 py-2.5 text-sm rounded-lg border transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                isSelected
                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                    : 'border-border hover:bg-secondary'
                            )}
                        >
                            {getPresetLabel(preset)}
                        </button>
                    )
                })}
            </div>

            {/* Custom Input Toggle */}
            <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                aria-expanded={showCustom}
                aria-controls="duration-custom-input"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                {showCustom ? (
                    <ChevronUp className="h-4 w-4"/>
                ) : (
                    <ChevronDown className="h-4 w-4"/>
                )}
                Enter custom duration
                {isCustomValue && !showCustom && (
                    <span className="text-xs text-primary ml-1">
            ({formatDuration(value!)})
          </span>
                )}
            </button>

            {/* Custom Input Section */}
            {showCustom && (
                <div id="duration-custom-input" className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={customInput}
                        onChange={(e) => handleCustomInputChange(e.target.value)}
                        placeholder={activeTab === 'minutes' ? '25' : '1.5'}
                        min={activeTab === 'minutes' ? 1 : 0.5}
                        step={activeTab === 'minutes' ? 1 : 0.5}
                        max={activeTab === 'minutes' ? 1440 : 24}
                        className="flex-1"
                        aria-label={`Enter duration in ${activeTab}`}
                    />
                    <span className="text-sm text-muted-foreground min-w-[50px]">
            {activeTab === 'minutes' ? 'min' : 'hours'}
          </span>
                </div>
            )}

            {/* Clear Selection */}
            {value !== null && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                    <X className="h-3.5 w-3.5"/>
                    Clear selection
                    <span className="text-xs opacity-70">
            ({formatDuration(value)})
          </span>
                </button>
            )}
        </div>
    )
}
