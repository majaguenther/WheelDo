import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import { getCurrentUser } from './auth'
import { toCategoryDTO, type CategoryDTO, type CategoryWithCountDTO } from './dto/category.dto'

/**
 * Get all categories for current user
 */
export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const categories = await db.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  })

  return categories.map(toCategoryDTO)
})

/**
 * Get categories with task counts
 */
export const getCategoriesWithCounts = cache(async (): Promise<CategoryWithCountDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []

  const categories = await db.category.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories.map((cat) => ({
    ...toCategoryDTO(cat),
    taskCount: cat._count.tasks,
  }))
})

/**
 * Get single category by ID with authorization check
 */
export const getCategoryById = cache(async (categoryId: string): Promise<CategoryDTO | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      userId: user.id,
    },
  })

  if (!category) return null
  return toCategoryDTO(category)
})

/**
 * Check if category name exists for user
 */
export const categoryNameExists = cache(
  async (name: string, excludeId?: string): Promise<boolean> => {
    const user = await getCurrentUser()
    if (!user) return false

    const existing = await db.category.findFirst({
      where: {
        userId: user.id,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
    })

    return existing !== null
  }
)
