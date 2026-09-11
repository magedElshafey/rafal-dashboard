import { useTranslation } from 'react-i18next'
import { NavLink, useMatch } from 'react-router-dom'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDirection } from '@/hooks/useDirection'
import { cn } from '@/lib/utils'
import type { DashboardNavigationItem } from '@/modules/dashboard/layout/dashboard-navigation'

type DashboardNavItemProps = {
  item: DashboardNavigationItem
  collapsed: boolean
  onNavigate: () => void
}

export function DashboardNavItem({ item, collapsed, onNavigate }: DashboardNavItemProps) {
  const { t } = useTranslation()
  const direction = useDirection()
  const label = t(item.labelKey)
  const Icon = item.icon
  const isActive = Boolean(useMatch({ path: item.to, end: item.match === 'exact' }))

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.to}
          end={item.match === 'exact'}
          aria-label={label}
          className={cn(
            'relative inline-flex h-11 min-w-0 items-center gap-3 whitespace-nowrap rounded-lg border border-transparent px-3 text-sm font-medium text-muted-foreground outline-none transition-colors',
            'hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
            isActive &&
              'border-primary/20 bg-accent text-primary before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-full before:bg-primary',
            collapsed && 'md:justify-center md:px-0'
          )}
          onClick={onNavigate}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
          <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
        </NavLink>
      </TooltipTrigger>
      {collapsed ? <TooltipContent side={direction === 'rtl' ? 'left' : 'right'}>{label}</TooltipContent> : null}
    </Tooltip>
  )
}
