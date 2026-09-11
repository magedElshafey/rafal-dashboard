import type { Key, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CircleCheckBig } from 'lucide-react'

import {
  DashboardInfoCard,
  type DashboardInfoCardProps,
} from '@/components/shared/dashboard/molecules/DashboardInfoCard'
import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { cn } from '@/lib/utils'

export type DashboardChecklistCardItem = {
  id?: Key
  label: ReactNode
  icon?: LucideIcon
}

type DashboardChecklistCardClassNames = {
  list?: string
  item?: string
  iconContainer?: string
  icon?: string
}

export type DashboardChecklistCardProps = Omit<DashboardInfoCardProps, 'header' | 'children'> & {
  title: ReactNode
  items: DashboardChecklistCardItem[]
  itemIcon?: LucideIcon
  classNames?: DashboardChecklistCardClassNames
}

export function DashboardChecklistCard({
  title,
  items,
  itemIcon = CircleCheckBig,
  className,
  contentClassName,
  classNames,
  ...props
}: DashboardChecklistCardProps) {
  return (
    <DashboardInfoCard
      {...props}
      header={{ title }}
      className={className}
      contentClassName={cn('mt-5', contentClassName)}
    >
      <ul className={cn('space-y-3', classNames?.list)}>
        {items.map((item, index) => {
          const Icon = item.icon ?? itemIcon

          return (
            <li key={item.id ?? index} className={cn('flex gap-2 text-sm text-course-chapter-meta', classNames?.item)}>
              <DashboardIcon
                icon={Icon}
                className={cn('size-5 bg-brand-50 text-brand-500', classNames?.iconContainer)}
                iconClassName={cn('size-4', classNames?.icon)}
              />

              <span className="min-w-0">{item.label}</span>
            </li>
          )
        })}
      </ul>
    </DashboardInfoCard>
  )
}
