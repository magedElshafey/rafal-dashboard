import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ContainerProps = ComponentProps<'div'> & {
  size?: 'default' | 'wide' | 'content' | 'narrow'
}

const sizes = {
  default: 'max-w-[1160px]',
  wide: 'max-w-[1440px]',
  content: 'max-w-[1280px]',
  narrow: 'max-w-[960px]',
}

export function Container({ size = 'wide', className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size], className)} {...props}>
      {children}
    </div>
  )
}
