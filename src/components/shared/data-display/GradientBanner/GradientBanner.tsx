import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export type GradientBannerProps = Omit<ComponentPropsWithoutRef<'section'>, 'children'> & {
  children: ReactNode
  contentClassName?: string
  ariaLabel?: string
}

export function GradientBanner({ children, className, contentClassName, ariaLabel, ...props }: GradientBannerProps) {
  return (
    <section
      {...props}
      aria-label={ariaLabel}
      className={cn(
        'relative overflow-hidden rounded-lg p-6 text-neutral-0 ',
        'bg-linear-to-b from-brand-500 to-[#002D7A]',
        className
      )}
    >
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </section>
  )
}
