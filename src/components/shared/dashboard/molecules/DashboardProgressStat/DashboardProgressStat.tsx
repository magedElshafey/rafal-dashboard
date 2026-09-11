import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { ProgressBar, type ProgressBarVariant } from '@/components/shared/dashboard/atoms/ProgressBar'
import { cn } from '@/lib/utils'

type DashboardProgressStatClassNames = {
  header?: string
  label?: string
  valueLabel?: string
  progress?: string
  progressIndicator?: string
}

export type DashboardProgressStatProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  label: ReactNode
  valueLabel: ReactNode
  value: number
  variant?: ProgressBarVariant
  ariaLabel?: string
  classNames?: DashboardProgressStatClassNames
  footer?: ReactNode
}

export function DashboardProgressStat({
  label,
  valueLabel,
  value,
  variant,
  ariaLabel,
  className,
  classNames,
  footer,
  ...props
}: DashboardProgressStatProps) {
  return (
    <div {...props} className={className}>
      <div className={cn('mb-2 flex items-center justify-between gap-4', classNames?.header)}>
        <p className={cn('text-sm font-normal text-content-secondary', classNames?.label)}>{label}</p>

        <p className={cn('text-md font-medium text-content-primary', classNames?.valueLabel)}>{valueLabel}</p>
      </div>

      <ProgressBar
        value={value}
        variant={variant}
        ariaLabel={ariaLabel ?? getProgressAriaLabel(label)}
        className={classNames?.progress}
        indicatorClassName={classNames?.progressIndicator}
      />
      {footer}
    </div>
  )
}

function getProgressAriaLabel(label: ReactNode) {
  return typeof label === 'string' ? label : 'Progress'
}
