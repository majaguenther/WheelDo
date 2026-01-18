'use client'

import { Fragment, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  description?: string
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full max-w-lg max-h-[90vh] overflow-auto bg-background rounded-xl shadow-lg border animate-in fade-in-0 zoom-in-95',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          {(title || description) && (
            <div className="px-6 pt-6 pb-4">
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn('px-6 pb-6', !title && !description && 'pt-6')}>
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  )
}
