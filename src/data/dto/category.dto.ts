import 'server-only'
import type { Category } from '@/generated/prisma/client'

/**
 * Category DTO - safe public representation
 */
export interface CategoryDTO {
  id: string
  name: string
  color: string
  icon: string | null
}

/**
 * Convert Category to DTO
 */
export function toCategoryDTO(
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
  }
}

/**
 * Category with task count for listing
 */
export interface CategoryWithCountDTO extends CategoryDTO {
  taskCount: number
}
