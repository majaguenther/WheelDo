'use server'

import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-server'
import { categoryNameExists } from '@/data/categories'
import {
  ActionError,
  withActionErrorHandling,
  type ActionResult,
} from '@/core/errors/action-error'
import { toActionState, type ActionState } from '@/core/errors/action-state'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from '@/core/validation/schemas'

/**
 * Create a new category
 */
export async function createCategory(
  input: unknown
): Promise<ActionResult<{ categoryId: string }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const result = createCategorySchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validated = result.data

    // Check if name already exists for this user
    const exists = await categoryNameExists(validated.name)
    if (exists) {
      throw new ActionError('CONFLICT', 'A category with this name already exists')
    }

    const category = await db.category.create({
      data: {
        name: validated.name,
        color: validated.color,
        icon: validated.icon,
        userId: user.id,
      },
    })

    revalidateTag(`categories:${user.id}`, 'max')

    return { categoryId: category.id }
  })
}

/**
 * Update an existing category
 */
export async function updateCategory(
  categoryId: unknown,
  input: unknown
): Promise<ActionResult<{ categoryId: string }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const validatedId = categoryIdSchema.safeParse(categoryId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid category ID')
    }

    const result = updateCategorySchema.safeParse(input)
    if (!result.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid input', {
        errors: result.error.flatten().fieldErrors,
      })
    }

    const validated = result.data

    // Check ownership
    const category = await db.category.findFirst({
      where: { id: validatedId.data, userId: user.id },
    })
    if (!category) {
      throw new ActionError('NOT_FOUND', 'Category not found')
    }

    // Check name uniqueness if changing name
    if (validated.name && validated.name !== category.name) {
      const exists = await categoryNameExists(validated.name, validatedId.data)
      if (exists) {
        throw new ActionError('CONFLICT', 'A category with this name already exists')
      }
    }

    await db.category.update({
      where: { id: validatedId.data },
      data: validated,
    })

    revalidateTag(`categories:${user.id}`, 'max')

    return { categoryId: validatedId.data }
  })
}

/**
 * Delete a category
 */
export async function deleteCategory(
  categoryId: unknown
): Promise<ActionResult<{ success: true }>> {
  return withActionErrorHandling(async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw new ActionError('UNAUTHORIZED', 'Authentication required')
    }

    const validatedId = categoryIdSchema.safeParse(categoryId)
    if (!validatedId.success) {
      throw new ActionError('VALIDATION_ERROR', 'Invalid category ID')
    }

    // Check ownership
    const category = await db.category.findFirst({
      where: { id: validatedId.data, userId: user.id },
    })
    if (!category) {
      throw new ActionError('NOT_FOUND', 'Category not found')
    }

    await db.category.delete({ where: { id: validatedId.data } })

    revalidateTag(`categories:${user.id}`, 'max')
    revalidateTag(`tasks:${user.id}`, 'max')

    return { success: true }
  })
}

// =============================================================================
// FormData-based Server Actions for useActionState / form action pattern
// =============================================================================

/**
 * Create a new category via FormData (for use with form action)
 */
export async function createCategoryFormAction(
  _prevState: ActionState<{ categoryId: string }>,
  formData: FormData
): Promise<ActionState<{ categoryId: string }>> {
  const input = {
    name: formData.get('name') as string,
    color: formData.get('color') as string,
    icon: (formData.get('icon') as string) || undefined,
  }

  const result = await createCategory(input)
  return toActionState(result)
}

/**
 * Update an existing category via FormData (for use with form action)
 * categoryId is bound to the action via .bind(null, categoryId)
 */
export async function updateCategoryFormAction(
  categoryId: string,
  _prevState: ActionState<{ categoryId: string }>,
  formData: FormData
): Promise<ActionState<{ categoryId: string }>> {
  const input = {
    name: (formData.get('name') as string) || undefined,
    color: (formData.get('color') as string) || undefined,
    icon: (formData.get('icon') as string) || undefined,
  }

  const result = await updateCategory(categoryId, input)
  return toActionState(result)
}

/**
 * Delete a category via FormData (for use with form action)
 */
export async function deleteCategoryFormAction(
  _prevState: ActionState<{ success: true }>,
  formData: FormData
): Promise<ActionState<{ success: true }>> {
  const categoryId = formData.get('categoryId') as string
  const result = await deleteCategory(categoryId)
  return toActionState(result)
}
