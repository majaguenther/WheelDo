import { z } from 'zod'

/**
 * Hex color validation regex
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

/**
 * Create category input schema
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be 50 characters or less')
    .trim(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color (e.g., #6366f1)')
    .default('#6366f1'),
  icon: z
    .string()
    .max(50, 'Icon name must be 50 characters or less')
    .optional()
    .nullable(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

/**
 * Update category input schema
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be 50 characters or less')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color')
    .optional(),
  icon: z
    .string()
    .max(50, 'Icon name must be 50 characters or less')
    .optional()
    .nullable(),
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

/**
 * Category ID validation schema
 */
export const categoryIdSchema = z.string().cuid('Invalid category ID')
