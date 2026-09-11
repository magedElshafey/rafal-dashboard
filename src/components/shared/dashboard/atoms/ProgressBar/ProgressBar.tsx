import type { ComponentPropsWithoutRef } from 'react'

import { getProgressBarPercentageColor, progressBarVariants, type ProgressBarVariant } from './progress-bar.variants'
import { cn } from '@/lib/utils'
import { clampProgressValue } from '@/utils/progress-value/clampProgressValue'

export type ProgressBarProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  value: number
  variant?: ProgressBarVariant
  indicatorClassName?: string
  ariaLabel?: string
}

export function ProgressBar({ value, variant, className, indicatorClassName, ariaLabel, ...props }: ProgressBarProps) {
  const safeValue = clampProgressValue(value)

  return (
    <div
      {...props}
      className={cn('h-2 w-full overflow-hidden rounded-md bg-black-50', className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          getProgressBarPercentageColor(safeValue),
          variant && progressBarVariants[variant],
          indicatorClassName
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
