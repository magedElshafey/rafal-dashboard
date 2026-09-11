import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type InfoListProps = {
  children: ReactNode
  className?: string
}

export type InfoRowOrientation = 'horizontal' | 'vertical'

export type InfoRowProps = {
  label: ReactNode
  value: ReactNode
  orientation?: InfoRowOrientation
  className?: string
  labelClassName?: string
  valueClassName?: string
}

const INFO_ROW_STYLES = {
  horizontal: {
    root: 'flex flex-wrap items-center justify-between gap-4',
    label: 'text-sm text-course-chapter-title',
    value: 'text-end text-sm font-medium text-content-heavy',
  },
  vertical: {
    root: '',
    label: 'mb-1 text-sm text-neutral-600',
    value: 'font-medium text-neutral-900',
  },
} as const satisfies Record<
  InfoRowOrientation,
  {
    root: string
    label: string
    value: string
  }
>

export function InfoList({ children, className }: InfoListProps) {
  return <dl className={cn('space-y-3', className)}>{children}</dl>
}

export function InfoRow({
  label,
  value,
  orientation = 'horizontal',
  className,
  labelClassName,
  valueClassName,
}: InfoRowProps) {
  const styles = INFO_ROW_STYLES[orientation]

  return (
    <div className={cn(styles.root, className)}>
      <dt className={cn(styles.label, labelClassName)}>{label}</dt>

      <dd className={cn(styles.value, valueClassName)}>{value}</dd>
    </div>
  )
}
