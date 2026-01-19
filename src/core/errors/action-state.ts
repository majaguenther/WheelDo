import type { ActionResult, ActionErrorCode } from './action-error'

/**
 * State shape for useActionState - compatible with ActionResult
 * Used for form-based server actions with progressive enhancement
 */
export type ActionState<T = void> = {
  success?: boolean
  data?: T
  error?: {
    code: ActionErrorCode
    message: string
    fieldErrors?: Record<string, string[]>
  }
} | null

/**
 * Convert ActionResult to ActionState
 * Useful for wrapping existing actions for use with useActionState
 */
export function toActionState<T>(result: ActionResult<T>): ActionState<T> {
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: {
      code: result.error.code,
      message: result.error.message,
      fieldErrors: result.error.details?.errors as Record<string, string[]> | undefined,
    },
  }
}
