import 'server-only'
import type { Category } from '@/generated/prisma/client'

// Re-export types from the client-safe types file
export type { CategoryDTO, CategoryWithCountDTO } from './category.types'
import type { CategoryDTO } from './category.types'

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
