import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = ComponentProps<'section'> & {
  spacing?: 'sm' | 'md' | 'lg' | 'none'
}

const spacingClasses = {
  none: '',
  sm: 'py-8 md:py-10',
  md: 'py-12 md:py-16',
  lg: 'py-16 md:py-24',
}

export function Section({ spacing = 'sm', className, children, ...props }: SectionProps) {
  return (
    <section className={cn(spacingClasses[spacing], className)} {...props}>
      {children}
    </section>
  )
}
