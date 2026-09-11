import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { statusBadgeVariants, type StatusBadgeVariant } from './status-badge.variants'
import { cn } from '@/lib/utils'

export type StatusBadgeProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  children: ReactNode
  variant?: StatusBadgeVariant
}

export function StatusBadge({ children, variant = 'neutral', className, ...props }: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        statusBadgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
