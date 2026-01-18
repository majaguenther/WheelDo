import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-border bg-transparent rounded-lg font-medium hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
