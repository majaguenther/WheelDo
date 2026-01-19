'use client'

import { useState, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/ui/submit-button'
import { createCategoryFormAction, deleteCategoryFormAction } from '@/actions/categories'
import type { CategoryDTO } from '@/data/dto/category.types'

interface CategoryManagerProps {
  categories: CategoryDTO[]
}

const DEFAULT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])

  // Create category action state
  const [createState, createAction, isCreatePending] = useActionState(
    createCategoryFormAction,
    null
  )

  // Delete category action state
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteCategoryFormAction,
    null
  )

  // Handle successful create - this is a legitimate pattern for useActionState
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (createState?.success) {
      setIsAddModalOpen(false)
      setSelectedColor(DEFAULT_COLORS[0])
      router.refresh()
    }
  }, [createState, router])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Handle successful delete
  useEffect(() => {
    if (deleteState?.success) {
      router.refresh()
    }
  }, [deleteState, router])

  const isPending = isCreatePending || isDeletePending

  return (
    <div className={isPending ? 'opacity-50 pointer-events-none' : ''}>
      {/* Category list */}
      <div className="space-y-2 mb-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.name}</span>
            </div>
            <form action={deleteAction}>
              <input type="hidden" name="categoryId" value={category.id} />
              <SubmitButton
                size="icon"
                variant="ghost"
                pendingText=""
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to delete this category? Tasks in this category will not be deleted.')) {
                    e.preventDefault()
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>

      {/* Add button */}
      <Button
        variant="outline"
        onClick={() => setIsAddModalOpen(true)}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </Button>

      {/* Add modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
        }}
        title="Add Category"
        description="Create a new category to organize your tasks"
      >
        <form action={createAction} className="space-y-4">
          {createState?.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {createState.error.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              name="name"
              placeholder="e.g., Shopping, Learning"
              autoFocus
              required
            />
            {createState?.error?.fieldErrors?.name && (
              <p className="text-sm text-red-600">
                {createState.error.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Hidden color input - value comes from state */}
          <input type="hidden" name="color" value={selectedColor} />

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    selectedColor === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingText="Adding...">
              Add Category
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
