import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { DashboardCard, type DashboardCardProps } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { cn } from '@/lib/utils'

import { dashboardNoticeCardVariants, type DashboardNoticeCardVariant } from './dashboard-notice-card.variants'

type DashboardNoticeCardClassNames = {
  content?: string
  textWrapper?: string
  icon?: string
  title?: string
  description?: string
}

export type DashboardNoticeCardProps = Omit<DashboardCardProps, 'children'> & {
  title: ReactNode
  description?: ReactNode
  icon: LucideIcon
  variant?: DashboardNoticeCardVariant
  classNames?: DashboardNoticeCardClassNames
}

export function DashboardNoticeCard({
  title,
  description,
  icon,
  variant = 'info',
  className,
  classNames,
  padding = 'md',
  ...props
}: DashboardNoticeCardProps) {
  const variantClassNames = dashboardNoticeCardVariants[variant]

  return (
    <DashboardCard {...props} padding={padding} className={cn(variantClassNames.card, className)}>
      <div className={cn('flex gap-2', classNames?.content)}>
        <DashboardIcon icon={icon} className={cn('size-9 rounded-full', variantClassNames.icon, classNames?.icon)} />

        <div className={cn('min-w-0', classNames?.textWrapper)}>
          <h2 className={cn('text-sm font-semibold', variantClassNames.title, classNames?.title)}>{title}</h2>

          {description && (
            <p className={cn('mt-1 text-xs leading-6', variantClassNames.description, classNames?.description)}>
              {description}
            </p>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
