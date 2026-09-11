import type { CSSProperties, ReactNode } from 'react'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { cn } from '@/lib/utils'

export type DashboardStatCardProps = {
  className?: string
  label: ReactNode
  labelClassName?: string
  value: ReactNode
  valueClassName?: string
  contentClassName?: string

  /**
   * Classes applied to the colored start border.
   */
  accentClassName?: string

  /**
   * Custom color for the start border.
   */
  accentColor?: string
}

export function DashboardStatCard({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  contentClassName,
  accentClassName,
  accentColor,
}: DashboardStatCardProps) {
  const cardStyle = accentColor
    ? ({
        '--dashboard-stat-card-accent': accentColor,
      } as CSSProperties)
    : undefined

  return (
    <DashboardCard
      radius="lg"
      padding="none"
      style={cardStyle}
      className={cn(
        'min-h-22 overflow-hidden rounded-lg bg-black-50',
        'border border-border-subtle border-s-4',
        'border-s-neutral-500 p-3 shadow-none',
        accentColor && 'border-s-[var(--dashboard-stat-card-accent)]',
        accentClassName,
        className
      )}
    >
      <div className={cn('flex h-full flex-col justify-between', contentClassName)}>
        <div className="flex items-end justify-between gap-3">
          <p
            className={cn(
              'max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
              'text-lg font-semibold leading-tight text-black-700',
              valueClassName
            )}
            title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
          >
            {value}
          </p>
        </div>
        <p
          className={cn(
            'max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
            'text-sm capitalize text-black-600',
            labelClassName
          )}
          title={typeof label === 'string' || typeof label === 'number' ? String(label) : undefined}
        >
          {label}
        </p>
      </div>
    </DashboardCard>
  )
}
