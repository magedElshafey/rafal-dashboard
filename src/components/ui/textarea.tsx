import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        [
          'min-h-32 w-full resize-y',
          'rounded-2xl border border-black-50',
          'bg-black-50',
          'px-4 py-3',
          'text-sm text-content-primary',
          'outline-none transition-all',
          'placeholder:text-content-muted',
          'hover:border-black-100',
          'focus:border-brand-500 focus-visible:border-brand-500',
          'focus:ring-3 focus:ring-brand-500/20 focus-visible:ring-3 focus-visible:ring-brand-500/20',
          'aria-invalid:border-error-500',
          'aria-invalid:ring-3 aria-invalid:ring-error-500/20',
          'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
          'read-only:cursor-default read-only:border-black-100 read-only:bg-black-100 read-only:text-content-secondary',
        ].join(' '),
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
