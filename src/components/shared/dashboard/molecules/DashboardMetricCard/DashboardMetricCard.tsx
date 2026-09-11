import type { ReactNode } from 'react'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'

import { dashboardMetricCardVariants, type DashboardMetricCardVariant } from './dashboard-metric-card.variants'
import { cn } from '@/lib/utils'

export type DashboardMetricCardProps = {
  value: ReactNode
  label: ReactNode
  variant?: DashboardMetricCardVariant
  className?: string
  valueClassName?: string
  labelClassName?: string
}

export function DashboardMetricCard({
  value,
  label,
  variant = 'primary',
  className,
  valueClassName,
  labelClassName,
}: DashboardMetricCardProps) {
  return (
    <DashboardCard radius="md" padding="md" className={cn(dashboardMetricCardVariants[variant], className)}>
      <p className={cn('text-2xl font-semibold leading-8', valueClassName)}>{value}</p>

      <p className={cn('mt-1 text-sm font-normal text-content-tertiary', labelClassName)}>{label}</p>
    </DashboardCard>
  )
}
