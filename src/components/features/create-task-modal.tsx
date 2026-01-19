'use client'

import { Modal } from '@/components/ui/modal'
import { TaskForm } from './task-form'
import type { CategoryDTO } from '@/data/dto/category.types'
import type { TaskDTO } from '@/data/dto/task.types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  categories: CategoryDTO[]
  availableTasks?: TaskDTO[] // Tasks available for parent selection
  parentId?: string // Pre-selected parent (when creating subtask from detail page)
}

export function CreateTaskModal({
  isOpen,
  onClose,
  categories,
  availableTasks = [],
  parentId: initialParentId,
}: CreateTaskModalProps) {
  // Determine if task is a subtask (has parent)
  const isSubtask = !!initialParentId

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSubtask ? 'Add Subtask' : 'Create New Task'}
      description={
        isSubtask
          ? 'Create a subtask for the selected parent task.'
          : 'Add a new task to your list. You can only work on one task at a time.'
      }
    >
      <TaskForm
        mode="create"
        categories={categories}
        availableTasks={availableTasks}
        parentId={initialParentId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  )
}
