import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { clampProgressValue } from '@/utils/progress-value/clampProgressValue'

import { progressRingVariants, type ProgressRingVariant } from './progress-ring.variants'

export type ProgressRingProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  value: number
  size?: number
  strokeWidth?: number
  variant?: ProgressRingVariant
  showValue?: boolean
  ariaLabel?: string
  trackClassName?: string
  indicatorClassName?: string
  valueClassName?: string
  valueLabelClassName?: string
  svgClassName?: string
  valueLabel?: string
}

type ProgressRingStyle = CSSProperties & {
  '--progress-ring-size'?: string
}

export function ProgressRing({
  value,
  size = 92,
  strokeWidth = 9,
  variant = 'primary',
  showValue = true,
  ariaLabel = 'Progress',
  className,
  trackClassName,
  indicatorClassName,
  valueClassName,
  valueLabelClassName,
  svgClassName,
  valueLabel = '',
  style,
  ...props
}: ProgressRingProps) {
  const safeValue = clampProgressValue(value)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safeValue / 100) * circumference

  const rootStyle: ProgressRingStyle = {
    '--progress-ring-size': `${size}px`,
    ...style,
  }

  return (
    <div
      {...props}
      style={rootStyle}
      className={cn(
        'relative inline-flex w-[min(var(--progress-ring-size),100%)] aspect-square shrink-0 items-center justify-center overflow-hidden',
        className
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={cn('absolute inset-0 size-full -rotate-90', svgClassName)}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn('text-neutral-100', trackClassName)}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-500 ease-out', progressRingVariants[variant], indicatorClassName)}
        />
      </svg>

      {showValue && (
        <div className="relative z-10 flex w-[72%] min-w-0 flex-col items-center justify-center overflow-hidden text-center leading-none">
          <span
            className={cn(
              'block max-w-full truncate text-xl font-bold leading-none text-content-primary sm:text-2xl',
              valueClassName
            )}
            title={`${safeValue}%`}
          >
            {safeValue}%
          </span>

          {valueLabel && (
            <p
              className={cn(
                'mt-1 block max-w-full truncate text-[10px] font-normal leading-tight text-neutral-600',
                valueLabelClassName
              )}
              title={valueLabel}
            >
              {valueLabel}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
