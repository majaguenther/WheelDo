import "server-only"
import { auth } from "./auth"
import { headers } from "next/headers"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Safe version of getSession that returns null during static generation
 * Use this in layouts that need to render static pages like 404
 */
export async function getSessionSafe() {
  try {
    return await getSession()
  } catch {
    // Return null during static generation when headers() is not available
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}
