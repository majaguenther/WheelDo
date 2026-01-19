import 'dotenv/config'
import {defineConfig} from 'prisma/config'

/**
 * Prisma 7 Configuration for Vercel Deployment
 *
 * This config centralizes all Prisma CLI settings.
 * The DATABASE_URL should be set in your environment variables.
 *
 * For Vercel deployments:
 * - Use a direct (non-pooled) connection URL for migrations
 * - If using Vercel Postgres, use POSTGRES_URL_NON_POOLING for CLI operations
 * - The app uses @prisma/adapter-pg for runtime connections (see src/lib/db.ts)
 */
export default defineConfig({
    // Path to your Prisma schema
    schema: 'prisma/schema.prisma',

    // Migration settings
    migrations: {
        path: 'prisma/migrations',
    },

    // Datasource configuration
    // Uses DATABASE_URL for all CLI operations (generate, migrate, push, etc.)
    datasource: {
        url: process.env.DATABASE_URL,
    },
})
