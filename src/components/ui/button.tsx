import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-medium capitalize',
    'cursor-pointer outline-none transition-all',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
    'focus-visible:ring-3 focus-visible:ring-primary/20',
    'aria-invalid:border-error aria-invalid:ring-error/20'
  ),
  {
    variants: {
      variant: {
        default: cn('bg-primary text-white shadow-xs', 'hover:bg-primary-600', 'active:bg-primary-700'),

        destructive: cn(
          'bg-error text-white shadow-xs',
          'hover:bg-error-600',
          'active:bg-error-700',
          'focus-visible:ring-error/20'
        ),

        outline: cn('border border-black-100 bg-transparent text-black-600'),

        secondary: cn('bg-black-50 text-black-900 shadow-xs', 'hover:bg-black-100', 'active:bg-black-200'),

        ghost: cn('bg-transparent text-black-900', 'hover:bg-black-50', 'active:bg-black-100'),

        link: cn('h-auto rounded-none p-0 text-primary underline-offset-4', 'hover:underline', 'focus-visible:ring-0'),

        success: cn('bg-success text-white shadow-xs', 'hover:bg-success-600', 'active:bg-success-700'),

        warning: cn('bg-warning text-white shadow-xs', 'hover:bg-warning-600', 'active:bg-warning-700'),

        info: cn('bg-info text-white shadow-xs', 'hover:bg-info-600', 'active:bg-info-700'),
      },

      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5',
        lg: 'h-11 rounded-md px-6 text-base has-[>svg]:px-4',
        icon: 'size-10',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type TButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    permissionName?: string
  }

function Button({ className, variant, size, asChild = false, permissionName, ...props }: TButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp type="button" data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}

export { Button, buttonVariants }
