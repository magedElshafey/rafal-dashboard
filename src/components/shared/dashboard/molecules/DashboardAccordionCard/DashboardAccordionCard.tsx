import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { DashboardCard, type DashboardCardProps } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardIcon } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { cn } from '@/lib/utils'

export type DashboardAccordionCardProps = Omit<DashboardCardProps, 'children'> & {
  title: ReactNode
  subtitle?: ReactNode
  icon?: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
  headerClassName?: string
  iconClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  chevronClassName?: string
  contentClassName?: string
  contentInnerClassName?: string
}

export function DashboardAccordionCard({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = true,
  className,
  headerClassName,
  iconClassName,
  titleClassName,
  subtitleClassName,
  chevronClassName,
  contentClassName,
  contentInnerClassName,
  padding = 'none',
  ...props
}: DashboardAccordionCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <DashboardCard {...props} padding={padding} className={cn('overflow-hidden', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prevOpen) => !prevOpen)}
        className={cn(
          'w-full border-b border-b-border-subtle p-3 text-start md:p-4',
          'cursor-pointer transition-colors hover:bg-surface-page',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
          headerClassName
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon && <DashboardIcon icon={icon} className={cn('size-9 rounded-full', iconClassName)} />}

            <div className="min-w-0">
              <h2 className={cn('wrap-break-word text-base font-semibold text-neutral-900', titleClassName)}>
                {title}
              </h2>

              {subtitle && (
                <p className={cn('mt-1 wrap-break-word text-xs font-medium text-content-secondary', subtitleClassName)}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn(
              'shrink-0 text-course-chapter-title transition-transform duration-300 ease-out',
              open && 'rotate-180',
              chevronClassName
            )}
          />
        </div>
      </button>

      <div
        id={contentId}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          contentClassName
        )}
      >
        <div className="min-h-0 overflow-hidden" aria-hidden={!open}>
          <div className={cn('space-y-3 p-3 md:p-4', contentInnerClassName)}>{children}</div>
        </div>
      </div>
    </DashboardCard>
  )
}
