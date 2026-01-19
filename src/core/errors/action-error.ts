/**
 * Error codes for Server Actions
 */
export type ActionErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

/**
 * Structured error for Server Actions
 * Provides consistent error handling across all actions
 */
export class ActionError extends Error {
  public readonly code: ActionErrorCode
  public readonly details?: Record<string, unknown>

  constructor(code: ActionErrorCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ActionError'
    this.code = code
    this.details = details

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, ActionError)
  }

  /**
   * Convert to a serializable response object
   */
  toResponse() {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    }
  }
}

/**
 * Type-safe action result
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ActionErrorCode; message: string; details?: Record<string, unknown> } }

/**
 * Helper to create success result
 */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper to create error result
 */
export function actionError(
  code: ActionErrorCode,
  message: string,
  details?: Record<string, unknown>
): ActionResult<never> {
  return {
    success: false,
    error: { code, message, details },
  }
}

/**
 * Wrap an async action with error handling
 */
export async function withActionErrorHandling<T>(
  action: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await action()
    return actionSuccess(data)
  } catch (error) {
    if (error instanceof ActionError) {
      return error.toResponse() as ActionResult<never>
    }

    console.error('Unexpected action error:', error)
    return actionError('INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
