'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import type { Category } from '@prisma/client'

interface CategoryManagerProps {
  categories: Category[]
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCategoryName.trim(),
            color: newCategoryColor,
          }),
        })

        if (!res.ok) throw new Error('Failed to create category')

        setNewCategoryName('')
        setNewCategoryColor(DEFAULT_COLORS[0])
        setIsAddModalOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Failed to create category:', error)
      }
    })
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Tasks in this category will not be deleted.')) {
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('Failed to delete category')

        router.refresh()
      } catch (error) {
        console.error('Failed to delete category:', error)
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
        onClose={() => setIsAddModalOpen(false)}
        title="Add Category"
        description="Create a new category to organize your tasks"
      >
        <div className="space-y-4">
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
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Add Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
