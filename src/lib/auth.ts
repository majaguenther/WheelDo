import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { passkey } from "@better-auth/passkey"
import { db } from "./db"

const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
  { name: 'Personal', color: '#8b5cf6', icon: 'user' },
  { name: 'Health', color: '#22c55e', icon: 'heart' },
  { name: 'Finance', color: '#eab308', icon: 'wallet' },
  { name: 'Home', color: '#f97316', icon: 'home' },
]

/**
 * Get the Relying Party ID for passkeys.
 * Uses Vercel's built-in env vars for automatic configuration.
 *
 * Priority order:
 * 1. PASSKEY_RP_ID - explicit override
 * 2. VERCEL_PROJECT_PRODUCTION_URL - production domain (e.g., wheeldo.vercel.app)
 * 3. VERCEL_URL - preview/branch deployment URL
 * 4. localhost - fallback for local development
 */
function getPasskeyRpId(): string {
  // 1. Explicit override
  if (process.env.PASSKEY_RP_ID) {
    return process.env.PASSKEY_RP_ID
  }

  // 2. Vercel production URL (stable domain)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL
  }

  // 3. Vercel deployment URL (preview/branch deployments)
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL
  }

  // 4. Fallback for local development
  return 'localhost'
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  experimental: {
    joins: true,  // 2-3x performance improvement
  },

  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  plugins: [
    passkey({
      rpID: getPasskeyRpId(),
      rpName: 'WheelDo',
    }),
  ],

  trustedOrigins: [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ].filter((origin): origin is string => Boolean(origin)),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
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
