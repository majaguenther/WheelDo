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

function getPasskeyRpId(): string {
  if (process.env.PASSKEY_RP_ID) {
    return process.env.PASSKEY_RP_ID
  }
  const baseUrl = process.env.BETTER_AUTH_URL
  if (baseUrl) {
    try {
      return new URL(baseUrl).hostname
    } catch {
      // Fall through
    }
  }
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
