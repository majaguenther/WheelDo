'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { createCategory, deleteCategory } from '@/actions/categories'
import type { CategoryDTO } from '@/data/dto/category.dto'

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
  const [isPending, startTransition] = useTransition()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setError(null)

    startTransition(async () => {
      const result = await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })

      if (result.success) {
        setNewCategoryName('')
        setNewCategoryColor(DEFAULT_COLORS[0])
        setIsAddModalOpen(false)
        router.refresh()
      } else {
        setError(result.error.message)
      }
    })
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Tasks in this category will not be deleted.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteCategory(id)

      if (result.success) {
        router.refresh()
      } else {
        console.error('Failed to delete category:', result.error.message)
      }
    })
  }

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
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteCategory(category.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
          setError(null)
        }}
        title="Add Category"
        description="Create a new category to organize your tasks"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Shopping, Learning"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    newCategoryColor === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || isPending}
            >
              {isPending ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
