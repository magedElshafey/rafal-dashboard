import { memo, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type AnimatedContentProps = ComponentProps<'div'> & {
  animationKey?: string
}

export const AnimatedContent = memo(function AnimatedContent({
  animationKey,
  className,
  children,
  ...props
}: AnimatedContentProps) {
  return (
    <div
      data-animation-key={animationKey}
      className={cn('motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200', className)}
      {...props}
    >
      {children}
    </div>
  )
})
