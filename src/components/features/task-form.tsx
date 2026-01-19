'use client'

import {useState, useEffect, useActionState, useMemo} from 'react'
import {useRouter} from 'next/navigation'
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
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Select} from '@/components/ui/select'
import {SubmitButton} from '@/components/ui/submit-button'
import {LocationAutocomplete} from '@/components/ui/location-autocomplete'
import {DurationPicker} from '@/components/ui/duration-picker'
import {UrgencySelector} from '@/components/ui/urgency-selector'
import {EffortSelector} from '@/components/ui/effort-selector'
import {ParentTaskSelector} from './parent-task-selector'
import {createTaskFormAction, updateTaskFormAction} from '@/actions/tasks'
import type {CategoryDTO} from '@/data/dto/category.types'
import type {TaskDTO, TaskDetailDTO} from '@/data/dto/task.types'
import type {Urgency, Effort, RecurrenceType} from '@/generated/prisma/client'

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
    {value: 'NONE', label: 'No repeat'},
    {value: 'DAILY', label: 'Daily'},
    {value: 'WEEKLY', label: 'Weekly'},
    {value: 'MONTHLY', label: 'Monthly'},
    {value: 'YEARLY', label: 'Yearly'},
]

export interface TaskFormProps {
    mode: 'create' | 'edit'
    initialData?: TaskDetailDTO | null
    categories: CategoryDTO[]
    availableTasks?: TaskDTO[]
    parentId?: string | null
    onSuccess: () => void
    onCancel: () => void
}

// Helper to parse date and time from ISO string
function parseDeadline(deadline: Date | string | null): { date: string; time: string } {
    if (!deadline) return {date: '', time: ''}
    const d = new Date(deadline)
    const date = d.toISOString().split('T')[0]
    const time = d.toTimeString().slice(0, 5)
    return {date, time}
}

// Helper to parse location - handles both JSON objects and plain text
function parseLocation(location: string | null): string {
    if (!location) return ''
    try {
        const parsed = JSON.parse(location)
        return parsed.formatted || parsed.name || location
    } catch {
        return location
    }
}

export function TaskForm({
                             mode,
                             initialData,
                             categories,
                             availableTasks = [],
                             parentId: initialParentId,
                             onSuccess,
                             onCancel,
                         }: TaskFormProps) {
    const router = useRouter()

    // Parse initial deadline if editing
    const initialDeadline = initialData ? parseDeadline(initialData.deadline) : {date: '', time: ''}

    // Determine initial showAdvanced state based on whether advanced fields have values
    const hasInitialAdvancedData =
        mode === 'edit' &&
        initialData &&
        (initialData.deadline || initialData.recurrenceType !== 'NONE' || initialData.location)
    const [showAdvanced, setShowAdvanced] = useState(!!hasInitialAdvancedData)

    // Form state - initialized from initialData for edit mode
    const [title, setTitle] = useState(initialData?.title ?? '')
    const [body, setBody] = useState(initialData?.body ?? '')
    const [duration, setDuration] = useState<number | null>(initialData?.duration ?? null)
    const [location, setLocation] = useState(parseLocation(initialData?.location ?? null))
    const [urgency, setUrgency] = useState<Urgency>(initialData?.urgency ?? 'MEDIUM')
    const [effort, setEffort] = useState<Effort>(initialData?.effort ?? 'MODERATE')
    const [deadlineDate, setDeadlineDate] = useState(initialDeadline.date)
    const [deadlineTime, setDeadlineTime] = useState(initialDeadline.time)
    const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '')
    const [recurrence, setRecurrence] = useState<RecurrenceType>(initialData?.recurrenceType ?? 'NONE')
    const [selectedParentId, setSelectedParentId] = useState<string | null>(
        initialParentId ?? initialData?.parentId ?? null
    )

    // Bind taskId for update mode
    const action = useMemo(() => {
        if (mode === 'create') {
            return createTaskFormAction
        }
        return updateTaskFormAction.bind(null, initialData!.id)
    }, [mode, initialData])

    const [state, formAction] = useActionState(action, null)

    // Handle success callback
    useEffect(() => {
        if (state?.success) {
            onSuccess()
            router.refresh()
        }
    }, [state?.success, onSuccess, router])

    // Update parentId when initialParentId prop changes
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            setSelectedParentId(initialParentId ?? initialData?.parentId ?? null)
        })
        return () => cancelAnimationFrame(id)
    }, [initialParentId, initialData?.parentId])

    // Determine if task is a subtask (has parent)
    const isSubtask = !!selectedParentId

    // Get today's date in YYYY-MM-DD format for min date validation
    const today = new Date().toISOString().split('T')[0]

    // Compute deadline ISO string for hidden input
    const deadlineValue = deadlineDate
        ? new Date(`${deadlineDate}T${deadlineTime || '23:59'}`).toISOString()
        : ''

    const isEditing = mode === 'edit'
    const submitLabel = isEditing ? 'Save Changes' : 'Create Task'
    const pendingLabel = isEditing ? 'Saving...' : 'Creating...'

    // Filter out the current task from available parent tasks (can't be own parent)
    const filteredAvailableTasks = isEditing && initialData
        ? availableTasks.filter(t => t.id !== initialData.id)
        : availableTasks

    // Extract field errors from state
    const fieldErrors = state?.error?.fieldErrors ?? {}

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {state.error.message}
                </div>
            )}

            {/* Title - controlled for UX, synced to form via name attribute */}
            <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    required
                    autoFocus
                    aria-invalid={!!fieldErrors.title}
                />
                {fieldErrors.title && (
                    <p className="text-sm text-red-600">{fieldErrors.title[0]}</p>
                )}
            </div>

            {/* Body - controlled for UX */}
            <div className="space-y-2">
                <Label htmlFor="body">Description</Label>
                <Textarea
                    id="body"
                    name="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add some details..."
                    rows={3}
                />
            </div>

            {/* Category - controlled for UX */}
            <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5"/>
                    Category
                </Label>
                <Select
                    id="category"
                    name="categoryId"
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

            {/* Duration - controlled via DurationPicker, hidden input for form */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5"/>
                    Duration
                </Label>
                <DurationPicker value={duration} onChange={setDuration}/>
                <input type="hidden" name="duration" value={duration ?? ''}/>
            </div>

            {/* Urgency selector - controlled, hidden input for form */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5"/>
                    Urgency
                </Label>
                <UrgencySelector value={urgency} onChange={setUrgency}/>
                <input type="hidden" name="urgency" value={urgency}/>
            </div>

            {/* Effort selector - controlled, hidden input for form */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5"/>
                    Effort Level
                </Label>
                <EffortSelector value={effort} onChange={setEffort}/>
                <input type="hidden" name="effort" value={effort}/>
            </div>

            {/* Advanced options toggle */}
            <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                {showAdvanced ? (
                    <ChevronUp className="h-4 w-4"/>
                ) : (
                    <ChevronDown className="h-4 w-4"/>
                )}
                {showAdvanced ? 'Hide' : 'Show'} more options
            </button>

            {/* Advanced options */}
            {showAdvanced && (
                <div className="space-y-4 pt-2 border-t">
                    {/* Deadline */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5"/>
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
                        {/* Hidden input for computed deadline ISO string */}
                        <input type="hidden" name="deadline" value={deadlineValue}/>
                    </div>

                    {/* Recurrence - disabled for subtasks */}
                    <div className="space-y-2">
                        <Label htmlFor="recurrence" className="flex items-center gap-1.5">
                            <Repeat className="h-3.5 w-3.5"/>
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
                        {/* Hidden input for recurrence */}
                        <input type="hidden" name="recurrenceType" value={isSubtask ? 'NONE' : recurrence}/>
                    </div>

                    {/* Location - controlled via LocationAutocomplete */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5"/>
                            Location
                        </Label>
                        <LocationAutocomplete
                            value={location}
                            onChange={setLocation}
                            placeholder="Search for a location..."
                        />
                        <input type="hidden" name="location" value={location}/>
                    </div>

                    {/* Parent task selector - only show if we have tasks available */}
                    {filteredAvailableTasks.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                            <ParentTaskSelector
                                tasks={filteredAvailableTasks}
                                selectedParentId={selectedParentId}
                                onSelect={setSelectedParentId}
                            />
                            <input type="hidden" name="parentId" value={selectedParentId ?? ''}/>
                        </div>
                    )}
                </div>
            )}

            {/* Hidden inputs for advanced fields when collapsed (to ensure they're still submitted) */}
            {!showAdvanced && (
                <>
                    <input type="hidden" name="deadline" value={deadlineValue}/>
                    <input type="hidden" name="recurrenceType" value={isSubtask ? 'NONE' : recurrence}/>
                    <input type="hidden" name="location" value={location}/>
                    <input type="hidden" name="parentId" value={selectedParentId ?? ''}/>
                </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <SubmitButton disabled={!title.trim()} pendingText={pendingLabel}>
                    {submitLabel}
                </SubmitButton>
            </div>
        </form>
    )
}
