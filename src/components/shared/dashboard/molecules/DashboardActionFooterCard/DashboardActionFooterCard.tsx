import type { ReactNode } from 'react'

import { DashboardCard, type DashboardCardProps } from '@/components/shared/dashboard/atoms/DashboardCard'
import { cn } from '@/lib/utils'

export type DashboardActionFooterCardProps = Omit<DashboardCardProps, 'children'> & {
  children: ReactNode
  helperText?: ReactNode
  helperClassName?: string
  actionsClassName?: string
}

export function DashboardActionFooterCard({
  children,
  helperText,
  className,
  helperClassName,
  actionsClassName,
  radius = '3xl',
  padding = 'lg',
  ...props
}: DashboardActionFooterCardProps) {
  return (
    <DashboardCard
      {...props}
      radius={radius}
      padding={padding}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      {helperText && (
        <p className={cn('min-w-0 text-sm leading-5 text-content-secondary sm:flex-1', helperClassName)}>
          {helperText}
        </p>
      )}

      <div
        className={cn(
          'grid w-full grid-cols-1 gap-3',
          'sm:w-auto sm:grid-flow-col sm:auto-cols-max sm:grid-cols-none sm:justify-end',
          actionsClassName
        )}
      >
        {children}
      </div>
    </DashboardCard>
  )
}
