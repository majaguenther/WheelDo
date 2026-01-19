import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Verify session and return basic auth info
 * Memoized within a single request using React cache()
 */
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return null
  }

  return {
    isAuth: true,
    userId: session.user.id,
  }
})

/**
 * Get current user with safe, public fields only
 * Memoized within a single request using React cache()
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return null
  }

  // Return only safe, public fields (never tokens or secrets)
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
})

/**
 * Require authentication - redirects to login if not authenticated
 * Memoized within a single request using React cache()
 */
export const requireAuth = cache(async () => {
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  return session
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
export type SessionInfo = NonNullable<Awaited<ReturnType<typeof verifySession>>>
