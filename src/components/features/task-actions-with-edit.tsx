'use client'

import { useState } from 'react'
import { TaskActions } from './task-actions'
import { EditTaskModal } from './edit-task-modal'
import type { CategoryDTO } from '@/data/dto/category.types'
import type { TaskDTO, TaskDetailDTO } from '@/data/dto/task.types'

interface TaskActionsWithEditProps {
  task: TaskDetailDTO
  role?: 'owner' | 'editor' | 'viewer'
  categories: CategoryDTO[]
  availableTasks: TaskDTO[]
}

export function TaskActionsWithEdit({
  task,
  role = 'owner',
  categories,
  availableTasks,
}: TaskActionsWithEditProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const canEdit = role === 'owner' || role === 'editor'
  const isCompleted = task.status === 'COMPLETED'

  // Only show edit functionality if user can edit and task is not completed
  const showEdit = canEdit && !isCompleted

  return (
    <>
      <TaskActions
        task={task}
        role={role}
        onEditClick={showEdit ? () => setIsEditModalOpen(true) : undefined}
      />

      {showEdit && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={task}
          categories={categories}
          availableTasks={availableTasks}
        />
      )}
    </>
  )
}
