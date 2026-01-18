'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. We&apos;ve been notified and are working to fix it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
