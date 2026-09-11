import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type DashboardSectionHeaderLinkAction = {
  label: ReactNode
  to: string
}

type DashboardSectionHeaderLabelAction = {
  label: ReactNode
  to?: never
}

type DashboardSectionHeaderAction = DashboardSectionHeaderLinkAction | DashboardSectionHeaderLabelAction

export type DashboardSectionHeaderProps = ComponentPropsWithoutRef<'div'> & {
  title: ReactNode
  description?: ReactNode
  action?: DashboardSectionHeaderAction
  titleClassName?: string
  actionClassName?: string
}

const DASHBOARD_SECTION_HEADER_ACTION_CLASS_NAME = cn(
  'text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
)

function isLinkAction(action: DashboardSectionHeaderAction): action is DashboardSectionHeaderLinkAction {
  return 'to' in action && Boolean(action.to)
}

export function DashboardSectionHeader({
  title,
  description,
  action,
  className,
  titleClassName,
  actionClassName,
  ...props
}: DashboardSectionHeaderProps) {
  return (
    <div {...props} className={cn('mb-6 flex items-center justify-between gap-4', className)}>
      <div>
        <h2 className={cn('text-md sm:text-lg md:text-xl font-semibold  text-neutral-900', titleClassName)}>{title}</h2>

        {description && <p className="mt-0.5 text-neutral-600 text-sm">{description}</p>}
      </div>

      {action &&
        (isLinkAction(action) ? (
          <Link to={action.to} className={cn(DASHBOARD_SECTION_HEADER_ACTION_CLASS_NAME, actionClassName)}>
            {action.label}
          </Link>
        ) : (
          <span className={cn('text-sm font-medium text-content-secondary', actionClassName)}>{action.label}</span>
        ))}
    </div>
  )
}
