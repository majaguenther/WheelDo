'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTaskModal } from './create-task-modal'
import type { Category } from '@/generated/prisma/client'

interface CreateTaskButtonProps {
  categories: Category[]
}

export function CreateTaskButton({ categories }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">New Task</span>
      </Button>
      <CreateTaskModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categories={categories}
      />
    </>
  )
}
