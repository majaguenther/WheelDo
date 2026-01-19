'use client'

import {useState, useMemo} from 'react'
import {Search, X, Link2} from 'lucide-react'
import {cn} from '@/lib/utils'
import {Label} from '@/components/ui/label'
import type {TaskDTO} from '@/data/dto/task.types'

interface ParentTaskSelectorProps {
    tasks: TaskDTO[]
    selectedParentId: string | null
    onSelect: (parentId: string | null) => void
    currentTaskId?: string // When editing, exclude self from options
}

/**
 * Toggle + search component for selecting a parent task
 * Used in create/edit task modal to make a task a subtask
 */
export function ParentTaskSelector({
                                       tasks,
                                       selectedParentId,
                                       onSelect,
                                       currentTaskId,
                                   }: ParentTaskSelectorProps) {
    const [isSubtask, setIsSubtask] = useState(!!selectedParentId)
    const [searchQuery, setSearchQuery] = useState('')

    const selectedParent = tasks.find((t) => t.id === selectedParentId)

    // Filter tasks: only root-level tasks (no parent), exclude current task if editing
    // Also filter by status as a safety net (server already filters, but cached data might be stale)
    const availableParents = useMemo(() => {
        return tasks.filter((t) => {
            // Only root-level tasks can be parents
            if (t.parentId !== null) return false
            // Exclude current task when editing
            if (currentTaskId && t.id === currentTaskId) return false
            // Safety: Only show active tasks (PENDING or IN_PROGRESS)
            return !(t.status !== 'PENDING' && t.status !== 'IN_PROGRESS');
        })
    }, [tasks, currentTaskId])

    const filteredTasks = useMemo(() => {
        if (!searchQuery) return availableParents
        const query = searchQuery.toLowerCase()
        return availableParents.filter(
            (t) =>
                t.title.toLowerCase().includes(query) ||
                t.category?.name?.toLowerCase().includes(query)
        )
    }, [availableParents, searchQuery])

    const handleToggle = () => {
        if (isSubtask) {
            onSelect(null)
            setSearchQuery('')
        }
        setIsSubtask(!isSubtask)
    }

    return (
        <div className="space-y-3">
            {/* Toggle */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isSubtask}
                    onClick={handleToggle}
                    className={cn(
                        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isSubtask ? 'bg-primary' : 'bg-input'
                    )}
                >
          <span
              className={cn(
                  'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
                  isSubtask ? 'translate-x-4' : 'translate-x-0'
              )}
          />
                </button>
                <Label className="cursor-pointer" onClick={handleToggle}>
          <span className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5"/>
            This is a subtask
          </span>
                </Label>
            </div>

            {/* Parent selector (shown when toggle is on) */}
            {isSubtask && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {selectedParent ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-secondary/50">
                            <Link2 className="h-4 w-4 text-muted-foreground shrink-0"/>
                            <span className="flex-1 truncate font-medium">{selectedParent.title}</span>
                            {selectedParent.category && (
                                <span
                                    className="text-xs px-1.5 py-0.5 rounded-full border"
                                    style={{
                                        borderColor: selectedParent.category.color,
                                        color: selectedParent.category.color,
                                    }}
                                >
                  {selectedParent.category.name}
                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => onSelect(null)}
                                className="p-1 hover:bg-secondary rounded transition-colors"
                                aria-label="Remove parent"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <input
                                    type="text"
                                    placeholder="Search for a parent task..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto rounded-lg border divide-y">
                                {filteredTasks.length === 0 ? (
                                    <p className="p-3 text-sm text-muted-foreground text-center">
                                        {availableParents.length === 0
                                            ? 'No tasks available to be a parent'
                                            : 'No tasks match your search'}
                                    </p>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <button
                                            key={task.id}
                                            type="button"
                                            onClick={() => {
                                                onSelect(task.id)
                                                setSearchQuery('')
                                            }}
                                            className="w-full p-2.5 text-left hover:bg-secondary/50 transition-colors flex items-center gap-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{task.title}</p>
                                                {task.category && (
                                                    <p
                                                        className="text-xs text-muted-foreground truncate"
                                                        style={{color: task.category.color}}
                                                    >
                                                        {task.category.name}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
