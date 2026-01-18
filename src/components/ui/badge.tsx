import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'destructive',
          'border border-border bg-transparent': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
