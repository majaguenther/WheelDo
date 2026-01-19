'use client'

import { Modal } from '@/components/ui/modal'
import { TaskForm } from './task-form'
import type { CategoryDTO } from '@/data/dto/category.types'
import type { TaskDTO, TaskDetailDTO } from '@/data/dto/task.types'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskDetailDTO
  categories: CategoryDTO[]
  availableTasks?: TaskDTO[]
}

export function EditTaskModal({
  isOpen,
  onClose,
  task,
  categories,
  availableTasks = [],
}: EditTaskModalProps) {
  const handleSuccess = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      description="Update your task details."
    >
      <TaskForm
        mode="edit"
        initialData={task}
        categories={categories}
        availableTasks={availableTasks}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  )
}
