import { memo, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type SkeletonProps = ComponentProps<'div'>

export const Skeleton = memo(function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-md bg-border-subtle motion-safe:animate-pulse', className)}
      {...props}
    />
  )
})
