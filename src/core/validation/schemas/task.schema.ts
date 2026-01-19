import { z } from 'zod'

/**
 * Effort levels matching Prisma enum
 */
export const effortSchema = z.enum(['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'EXTREME'])

/**
 * Urgency levels matching Prisma enum
 */
export const urgencySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

/**
 * Task status matching Prisma enum
 */
export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'])

/**
 * Create task input schema
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  body: z.string().max(10000, 'Body must be 10000 characters or less').trim().optional(),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)')
    .optional()
    .nullable(),
  location: z.string().max(500, 'Location must be 500 characters or less').trim().optional().nullable(),
  effort: effortSchema.default('MODERATE'),
  urgency: urgencySchema.default('MEDIUM'),
  deadline: z.string().datetime({ message: 'Invalid deadline format' }).optional().nullable(),
  categoryId: z.string().cuid('Invalid category ID').optional().nullable(),
  parentId: z.string().cuid('Invalid parent task ID').optional().nullable(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

/**
 * Update task input schema
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  body: z.string().max(10000, 'Body must be 10000 characters or less').trim().optional().nullable(),
  duration: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(1440, 'Duration cannot exceed 24 hours')
    .optional()
    .nullable(),
  location: z.string().max(500, 'Location must be 500 characters or less').trim().optional().nullable(),
  effort: effortSchema.optional(),
  urgency: urgencySchema.optional(),
  deadline: z.string().datetime({ message: 'Invalid deadline format' }).optional().nullable(),
  categoryId: z.string().cuid('Invalid category ID').optional().nullable(),
  parentId: z.string().cuid('Invalid parent task ID').optional().nullable(),
  status: taskStatusSchema.optional(),
  position: z.number().int().min(0).optional(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

/**
 * Update task status schema
 */
export const updateTaskStatusSchema = z.object({
  taskId: z.string().cuid('Invalid task ID'),
  status: taskStatusSchema,
})

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>

/**
 * Task ID validation schema
 */
export const taskIdSchema = z.string().cuid('Invalid task ID')
