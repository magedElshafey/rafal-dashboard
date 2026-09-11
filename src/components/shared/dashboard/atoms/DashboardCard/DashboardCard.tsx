import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'
import { dashboardCardVariants, type DashboardCardVariants } from './dashboard-card.variants'

export type DashboardCardProps = ComponentProps<'div'> & DashboardCardVariants

export function DashboardCard({ radius, padding = 'md', className, children, ...props }: DashboardCardProps) {
  return (
    <div className={cn(dashboardCardVariants({ radius, padding }), className)} {...props}>
      {children}
    </div>
  )
}
