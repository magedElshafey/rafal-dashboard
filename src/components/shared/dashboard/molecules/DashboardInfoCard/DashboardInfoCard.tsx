import type { ReactNode } from 'react'

import { DashboardCard, type DashboardCardProps } from '@/components/shared/dashboard/atoms/DashboardCard'
import {
  DashboardCardHeader,
  type DashboardCardHeaderProps,
} from '@/components/shared/dashboard/molecules/DashboardCardHeader'
import { cn } from '@/lib/utils'

export type DashboardInfoCardProps = Omit<DashboardCardProps, 'children'> & {
  header: DashboardCardHeaderProps
  children?: ReactNode
  headerEnd?: ReactNode
  headerClassName?: string
  contentClassName?: string
  media?: ReactNode
}

export function DashboardInfoCard({
  header,
  children,
  headerEnd,
  className,
  headerClassName,
  contentClassName,
  radius = 'xl',
  padding = 'md',
  media,
  ...props
}: DashboardInfoCardProps) {
  const hasContent = children !== null && children !== undefined

  return (
    <DashboardCard radius={radius} padding={padding} className={className} {...props}>
      <div className={cn('flex flex-wrap items-start justify-between gap-4', headerClassName)}>
        <DashboardCardHeader media={media} {...header} />
        {headerEnd}
      </div>

      {hasContent && <div className={cn('mt-4', contentClassName)}>{children}</div>}
    </DashboardCard>
  )
}
