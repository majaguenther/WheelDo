'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Calendar,
  Flag,
  Zap,
  Repeat,
  FolderOpen,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { DurationPicker } from '@/components/ui/duration-picker'
import { cn } from '@/lib/utils'
import type { Category, Urgency, Effort, RecurrenceType } from '@/generated/prisma/client'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  parentId?: string
}

const urgencyOptions: { value: Urgency; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-red-500' },
]

const effortOptions: { value: Effort; label: string; count: number }[] = [
  { value: 'MINIMAL', label: 'Minimal', count: 1 },
  { value: 'LOW', label: 'Low', count: 2 },
  { value: 'MODERATE', label: 'Moderate', count: 3 },
  { value: 'HIGH', label: 'High', count: 4 },
  { value: 'EXTREME', label: 'Extreme', count: 5 },
]

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'NONE', label: 'No repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function CreateTaskModal({
  isOpen,
  onClose,
  categories,
  parentId,
}: CreateTaskModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [duration, setDuration] = useState<number | null>(null)
  const [location, setLocation] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('MEDIUM')
  const [effort, setEffort] = useState<Effort>('MODERATE')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE')

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0]

  const resetForm = () => {
    setTitle('')
    setBody('')
    setDuration(null)
    setLocation('')
    setUrgency('MEDIUM')
    setEffort('MODERATE')
    setDeadlineDate('')
    setDeadlineTime('')
    setCategoryId('')
    setRecurrence('NONE')
    setShowAdvanced(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    // Combine date and time into ISO string
    let deadline: string | undefined
    if (deadlineDate) {
      // If time is provided, use it; otherwise default to end of day (23:59)
      const timeStr = deadlineTime || '23:59'
      deadline = new Date(`${deadlineDate}T${timeStr}`).toISOString()
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim() || undefined,
            duration: duration ?? undefined,
            location: location || undefined,
            urgency,
            effort,
            deadline,
            categoryId: categoryId || undefined,
            recurrenceType: recurrence,
            parentId,
          }),
        })

        if (!res.ok) throw new Error('Failed to create task')

        resetForm()
        onClose()
        router.refresh()
      } catch (error) {
        console.error('Failed to create task:', error)
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentId ? 'Add Subtask' : 'Create New Task'}
      description="Add a new task to your list. You can only work on one task at a time."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            autoFocus
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="body">Description</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add some details..."
            rows={3}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Category
          </Label>
          <Select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Duration
          </Label>
          <DurationPicker value={duration} onChange={setDuration} />
        </div>

        {/* Urgency selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            Urgency
          </Label>
          <div className="flex gap-2">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUrgency(opt.value)}
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                  urgency === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-secondary'
                )}
              >
                <span className={opt.color}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Effort selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Effort Level
          </Label>
          <div className="flex gap-1">
            {effortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEffort(opt.value)}
                className={cn(
                  'flex-1 px-2 py-2 text-sm rounded-lg border transition-colors flex flex-col items-center gap-1',
                  effort === opt.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-secondary'
                )}
                title={opt.label}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: opt.count }).map((_, i) => (
                    <Zap
                      key={i}
                      className={cn(
                        'h-3 w-3',
                        effort === opt.value
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            {/* Deadline */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Deadline
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="deadlineDate" className="sr-only">
                    Date
                  </Label>
                  <Input
                    id="deadlineDate"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    min={today}
                    className="w-full"
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor="deadlineTime" className="sr-only">
                    Time (optional)
                  </Label>
                  <Input
                    id="deadlineTime"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    placeholder="Time"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Time is optional. Defaults to end of day if not set.
              </p>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label htmlFor="recurrence" className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Repeat
              </Label>
              <Select
                id="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </Label>
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Search for a location..."
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !title.trim()}>
            {isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
