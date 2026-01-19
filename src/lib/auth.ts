import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { passkey } from "@better-auth/passkey"
import { db } from "./db"

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
  { name: 'Personal', color: '#8b5cf6', icon: 'user' },
  { name: 'Health', color: '#22c55e', icon: 'heart' },
  { name: 'Finance', color: '#eab308', icon: 'wallet' },
  { name: 'Home', color: '#f97316', icon: 'home' },
]

// Get the app URL for passkey configuration
const getAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

// Get the RP ID (domain without protocol/port)
const getRpId = () => {
  const url = getAppUrl()
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return 'localhost'
  }
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Update every 24 hours
  },
  plugins: [
    passkey({
      rpID: getRpId(),
      rpName: 'WheelDo',
      origin: getAppUrl(),
    }),
  ],
  trustedOrigins: [
    'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create default categories for the new user
          await db.category.createMany({
            data: DEFAULT_CATEGORIES.map((cat) => ({
              ...cat,
              userId: user.id,
            })),
            skipDuplicates: true,
          })
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
