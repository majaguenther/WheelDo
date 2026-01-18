import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ size = 'md', className }: LoadingProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-muted border-t-primary',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
        },
        className
      )}
    />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" />
    </div>
  )
}
