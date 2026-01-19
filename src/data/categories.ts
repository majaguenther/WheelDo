import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from './auth'
import { toCategoryDTO, type CategoryDTO, type CategoryWithCountDTO } from './dto/category.dto'

// ============================================
// New functions with userId parameter (for parallel data fetching)
// ============================================

/**
 * Get all categories for a user
 * Optimized: no internal auth check
 */
export const getCategoriesForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const categories = await db.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, color: true, icon: true },
      })
      return categories as CategoryDTO[]
    },
    ['categories', userId],
    { tags: ['categories'], revalidate: 300 }
  )()

/**
 * Get categories with task counts for a user
 */
export const getCategoriesWithCountsForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const categories = await db.category.findMany({
        where: { userId },
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
      })) as CategoryWithCountDTO[]
    },
    ['categories', userId, 'counts'],
    { tags: ['categories', 'tasks'], revalidate: 300 }
  )()

// ============================================
// Legacy functions (for backwards compatibility)
// These still call getCurrentUser() internally
// ============================================

/**
 * Internal cached function to fetch categories for a user
 */
const fetchCategoriesForUser = (userId: string) =>
  unstable_cache(
    async () => {
      const categories = await db.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      })
      return categories.map(toCategoryDTO)
    },
    ['categories-legacy', userId],
    { tags: ['categories'], revalidate: 60 }
  )

/**
 * Get all categories for current user
 * @deprecated Use getCategoriesForUser(userId) with user from getCurrentUser()
 */
export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  return fetchCategoriesForUser(user.id)()
})

/**
 * Internal cached function to fetch categories with counts
 */
const fetchCategoriesWithCounts = (userId: string) =>
  unstable_cache(
    async () => {
      const categories = await db.category.findMany({
        where: { userId },
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
    },
    ['categories-legacy', userId, 'counts'],
    { tags: ['categories', 'tasks'], revalidate: 60 }
  )

/**
 * Get categories with task counts
 * @deprecated Use getCategoriesWithCountsForUser(userId)
 */
export const getCategoriesWithCounts = cache(async (): Promise<CategoryWithCountDTO[]> => {
  const user = await getCurrentUser()
  if (!user) return []
  return fetchCategoriesWithCounts(user.id)()
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
