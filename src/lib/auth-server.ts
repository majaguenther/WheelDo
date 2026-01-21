import "server-only"
import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./auth"

export interface CurrentUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface SessionInfo {
  isAuth: true
  userId: string
}

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export async function getSessionSafe() {
  try {
    return await getSession()
  } catch {
    return null
  }
}

export const verifySession = cache(async (): Promise<SessionInfo | null> => {
  const session = await getSession()
  if (!session?.user?.id) return null
  return { isAuth: true, userId: session.user.id }
})

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession()
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    image: session.user.image ?? null,
  }
})

// For layouts/pages - redirects to login
export const requireAuth = cache(async (): Promise<SessionInfo> => {
  const session = await verifySession()
  if (!session) redirect('/login')
  return session
})

// For actions/API routes - throws error
export const requireAuthOrThrow = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user
})

// Re-export getBaseUrl for backwards compatibility
// Use @/lib/url directly for static contexts (sitemap, robots, etc.)
export { getBaseUrl } from './url'
