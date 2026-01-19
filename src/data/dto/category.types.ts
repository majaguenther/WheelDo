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
 * Category with task count for listing
 */
export interface CategoryWithCountDTO extends CategoryDTO {
  taskCount: number
}
