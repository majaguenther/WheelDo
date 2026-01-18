# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WheelDo is a TODO application with unique features like single-task focus (only one task in progress at a time), task
dependencies, and a "spin the wheel" mini-game for task selection. Users authenticate via GitHub SSO.

## Tech Stack

- **Framework**: Next.js 16.1.3 (App Router, deployed on Vercel)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth) with GitHub SSO
- **Styling**: Tailwind CSS
- **Icons**: Lucide v0.562.0
- **Location API**: Geoapify (OpenStreetMap-based autocomplete)
    - Endpoint: `https://api.geoapify.com/v1/geocode/autocomplete?text={query}&apiKey={apiKey}`
- **Reference**: [Next.js + Prisma + Postgres Guide](https://vercel.com/kb/guide/nextjs-prisma-postgres)

## Design Philosophy

Clean and modern UI with good UX. Prioritize simplicity and ease of use.

**Mobile-First Responsive Design:**
- Design for mobile screens first, then scale up to desktop
- Touch-friendly tap targets (min 44x44px)
- Responsive layouts using Tailwind breakpoints (sm, md, lg, xl)
- Bottom navigation or hamburger menu for mobile
- Swipe gestures where appropriate (e.g., complete/defer tasks)

## Environment Variables

Create a `.env.local` file in the project root (never commit this file):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wheeldo"

# Auth.js (NextAuth)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GITHUB_ID="your-github-oauth-app-id"
AUTH_GITHUB_SECRET="your-github-oauth-app-secret"

# Geoapify (Location Autocomplete)
NEXT_PUBLIC_GEOAPIFY_API_KEY="your-geoapify-api-key"
```

**Setup:**

1. Copy `.env.example` to `.env.local`
2. Get GitHub OAuth credentials: GitHub Settings → Developer Settings → OAuth Apps
3. Get Geoapify API key: https://myprojects.geoapify.com/
4. Generate AUTH_SECRET: `openssl rand -base64 32`

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (safe for Geoapify since it's a client-side
autocomplete).

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Generate types
npm run typegen

# Database operations (Prisma)
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Open database GUI
```

## Project Structure

```
src/
├── app/                      # App Router (routes & pages)
│   ├── layout.tsx            # Root layout (required)
│   ├── page.tsx              # Home page (/)
│   ├── loading.tsx           # Loading UI
│   ├── error.tsx             # Error boundary
│   ├── not-found.tsx         # 404 page
│   ├── (auth)/               # Route group for auth pages
│   │   ├── login/
│   │   └── callback/
│   ├── dashboard/            # Dashboard routes (main todo list)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── tasks/                # Task routes
│   │   └── [id]/             # Dynamic task detail/edit
│   │       └── page.tsx
│   ├── wheel/                # Wheel page
│   │   └── page.tsx
│   ├── history/              # Completion history
│   │   └── page.tsx
│   ├── settings/             # User settings
│   │   └── page.tsx          # Profile, themes, account
│   └── api/                  # API routes
│       └── [...]/route.ts
├── components/               # React components
│   ├── ui/                   # Reusable UI components
│   └── features/             # Feature-specific components
├── lib/                      # Utility functions & shared logic
│   ├── db.ts                 # Database client
│   ├── auth.ts               # Auth configuration
│   └── utils.ts              # Helper functions
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript type definitions
└── styles/                   # Global styles
    └── globals.css           # Tailwind imports
```

## File Conventions

| File            | Purpose                                         |
|-----------------|-------------------------------------------------|
| `layout.tsx`    | Shared UI wrapper (persists across navigations) |
| `page.tsx`      | Unique page UI (route becomes accessible)       |
| `loading.tsx`   | Loading skeleton (automatic Suspense)           |
| `error.tsx`     | Error boundary for route segment                |
| `not-found.tsx` | 404 UI                                          |
| `route.ts`      | API endpoint                                    |

## Routing Patterns

### Route Groups

Use `(groupName)` folders to organize without affecting URL:

```
app/(auth)/login/page.tsx  →  /login
app/(marketing)/page.tsx   →  /
```

### Dynamic Routes

```
app/tasks/[id]/page.tsx    →  /tasks/123
app/[...slug]/page.tsx     →  catch-all route
```

### Private Folders

Use `_folderName` for non-routable files:

```
app/dashboard/_components/TaskCard.tsx  # Not a route
```

## Component Patterns

### Server Components (Default)

Use for: data fetching, database access, keeping secrets safe, reducing JS bundle.

```tsx
// app/dashboard/page.tsx (Server Component by default)
import {getTasks} from '@/lib/db'

export default async function DashboardPage() {
    const tasks = await getTasks()
    return <TaskList tasks={tasks}/>
}
```

### Client Components

Use for: interactivity, state, effects, browser APIs. Add `'use client'` directive.

```tsx
// components/ui/like-button.tsx
'use client'

import {useState} from 'react'

export function LikeButton({initialLikes}: { initialLikes: number }) {
    const [likes, setLikes] = useState(initialLikes)
    return <button onClick={() => setLikes(likes + 1)}>{likes}</button>
}
```

### Composition Pattern

Pass Server Components as children to Client Components:

```tsx
// Client wrapper
'use client'

export function Modal({children}) {
    return <div className="modal">{children}</div>
}

// Server page
import {Modal} from '@/components/ui/modal'
import {TaskDetails} from '@/components/features/task-details' // Server Component

export default function Page() {
    return (
        <Modal>
            <TaskDetails/> {/* Server Component inside Client Component */}
        </Modal>
    )
}
```

### Context Providers

Wrap in Client Component, use in root layout:

```tsx
// components/providers.tsx
'use client'
import {ThemeProvider} from './theme-context'

export function Providers({children}) {
    return <ThemeProvider>{children}</ThemeProvider>
}
```

## Data Fetching Patterns

### Server Component Fetching

```tsx
export default async function Page() {
    const data = await fetch('https://api.example.com/data')
    const posts = await data.json()
    return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Database Queries (with Prisma)

```tsx
import {db} from '@/lib/db'

export default async function Page() {
    const tasks = await db.task.findMany()
    return <TaskList tasks={tasks}/>
}
```

### Parallel Data Fetching

```tsx
const [tasks, categories] = await Promise.all([
    getTasks(),
    getCategories()
])
```

### Streaming with Suspense

```tsx
import {Suspense} from 'react'

export default function Page() {
    return (
        <>
            <Header/>
            <Suspense fallback={<TaskListSkeleton/>}>
                <TaskList/>
            </Suspense>
        </>
    )
}
```

## Styling with Tailwind CSS

Import in `app/globals.css`:

```css
@import 'tailwindcss';
```

Usage:

```tsx
<main className="flex min-h-screen flex-col items-center p-24">
    <h1 className="text-4xl font-bold">WheelDo</h1>
</main>
```

### Responsive Patterns

```tsx
{/* Mobile-first: stack on mobile, row on desktop */}
<div className="flex flex-col md:flex-row gap-4">

{/* Hide on mobile, show on desktop */}
<nav className="hidden md:block">

{/* Show on mobile, hide on desktop */}
<button className="md:hidden">

{/* Responsive padding */}
<div className="p-4 md:p-6 lg:p-8">

{/* Responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Best Practices

### Component Organization

- Keep Server Components as default for data fetching
- Only add `'use client'` to specific interactive components
- Use `server-only` package to prevent accidental client imports of server code

### Performance

- Use `loading.tsx` for route-level loading states
- Use `<Suspense>` for component-level streaming
- Fetch data in parallel with `Promise.all()`
- Keep Client Components small to reduce JS bundle

### Type Safety

- Use `PageProps<'/path/[param]'>` for type-safe route props
- Run `npm run typegen` to generate route types

### Error Handling

- Add `error.tsx` to route segments for error boundaries
- Use `not-found.tsx` for 404 handling
- Wrap parallel fetches with `Promise.allSettled()` for graceful degradation

---

## Architecture Notes

### Todo Model Parameters

- **Title**: Required text field
- **Body**: Optional description/notes
- **Duration**: Minutes/hours numeric (e.g., "30 min", "2 hours") - used for wheel filtering
- **Location**: Autocomplete via Geoapify (OSM-based suggestions)
- **Effort**: Icon-based scale using Lucide icons
- **Urgency**: high/medium/low (default: medium)
- **Deadline**: Optional date/time with color escalation (yellow → orange → red) + badge indicator
- **Recurrence**: Full calendar-style (daily, weekly, monthly, custom day selection, complex patterns like Outlook)
- **Dependencies**: Parent-child relationship (one level deep only)
- **Category**: Predefined with customization (defaults: Work, Personal, Health, Finance, Home - users can add/edit)

### Core Constraints

- Users can only have ONE task "in progress" at a time
- To switch tasks, users must explicitly defer (task returns to list in normal position)
- Dependencies block child task completion until parent is done

### Main Views

**Todo List (default)**: Main view showing all todos with filter options (by urgency, location, effort, duration,
category)

**Wheel Page (separate)**: Dedicated page for task selection when indecisive

- User specifies max duration to filter tasks that fit their available time
- Duration is the ONLY filter on wheel page (keeps it simple)
- Displays filtered eligible todos on a spinning wheel
- User spins the wheel to randomly select their next task
- The selected task becomes the active "in progress" task

### UX Patterns

**Active Task Display**

- Task "in progress" is always pinned to the top of the list
- Clearly distinguished visually so it's obvious which task is active

**Task Creation**

- Modal overlay on main page
- Compact default (title + body) with expandable "more options" for other fields

**Task Completion Flow**

- Confetti celebration animation
- Suggest next highest priority task (dismissible - user can return to list instead)

**Dependency Display**

- Nested/indented tree view (children appear indented under parent task)

**Deadline Urgency**

- Color escalation on task cards as deadline approaches (yellow → orange → red)
- Badge/indicator showing urgency level

### User Features

- Profile from SSO with customizable color themes (primary, secondary, accent)
- Share individual tasks (invite collaborators to specific tasks)

### Additional Features

**Completion History**

- Archive view of all completed tasks with search
- Ability to undo/revert accidental completions

**PWA Support**

- Progressive Web App for mobile installation
