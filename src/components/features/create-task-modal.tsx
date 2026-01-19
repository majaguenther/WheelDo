'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { UrgencySelector } from '@/components/ui/urgency-selector'
import { EffortSelector } from '@/components/ui/effort-selector'
import { ParentTaskSelector } from './parent-task-selector'
import { createTask } from '@/actions/tasks'
import type { CategoryDTO } from '@/data/dto/category.types'
import type { TaskDTO } from '@/data/dto/task.types'
import type { Urgency, Effort, RecurrenceType } from '@/generated/prisma/client'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  categories: CategoryDTO[]
  availableTasks?: TaskDTO[] // Tasks available for parent selection
  parentId?: string // Pre-selected parent (when creating subtask from detail page)
}

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
  availableTasks = [],
  parentId: initialParentId,
}: CreateTaskModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(initialParentId || null)

  // Update parentId when initialParentId prop changes
  useEffect(() => {
    // Use requestAnimationFrame to avoid sync setState warning
    // This syncs the selected parent when the modal reopens with a different initial parent
    const id = requestAnimationFrame(() => {
      setSelectedParentId(initialParentId || null)
    })
    return () => cancelAnimationFrame(id)
  }, [initialParentId])

  // Determine if task is a subtask (has parent)
  const isSubtask = !!selectedParentId

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
    setSelectedParentId(initialParentId || null)
    setShowAdvanced(false)
    setError(null)
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
      const result = await createTask({
        title: title.trim(),
        body: body.trim() || undefined,
        duration: duration ?? undefined,
        location: location || undefined,
        urgency,
        effort,
        deadline,
        categoryId: categoryId || undefined,
        parentId: selectedParentId || undefined,
        // Subtasks cannot have recurrence
        recurrenceType: isSubtask ? 'NONE' : recurrence,
      })

      if (result.success) {
        resetForm()
        onClose()
        router.refresh()
      } else {
        setError(result.error.message)
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSubtask ? 'Add Subtask' : 'Create New Task'}
      description={isSubtask ? 'Create a subtask for the selected parent task.' : 'Add a new task to your list. You can only work on one task at a time.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

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

        {/* Parent task selector - only show if we have tasks available */}
        {availableTasks.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <ParentTaskSelector
              tasks={availableTasks}
              selectedParentId={selectedParentId}
              onSelect={setSelectedParentId}
            />
          </div>
        )}

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
          <UrgencySelector value={urgency} onChange={setUrgency} />
        </div>

        {/* Effort selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Effort Level
          </Label>
          <EffortSelector value={effort} onChange={setEffort} />
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

            {/* Recurrence - disabled for subtasks */}
            <div className="space-y-2">
              <Label htmlFor="recurrence" className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Repeat
              </Label>
              <Select
                id="recurrence"
                value={isSubtask ? 'NONE' : recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                disabled={isSubtask}
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {isSubtask && (
                <p className="text-xs text-muted-foreground">
                  Subtasks cannot have recurrence enabled.
                </p>
              )}
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
