import { cva, type VariantProps } from 'class-variance-authority'

export const dashboardCardVariants = cva('border border-border-subtle bg-surface-card', {
  variants: {
    radius: {
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-3 md:p-3',
      lg: 'p-4 md:p-5',
      xl: 'p-5 md:p-6',
      '2xl': 'p-6 md:p-8',
    },
  },
  defaultVariants: {
    radius: 'lg',
    padding: 'md',
  },
})

export type DashboardCardVariants = VariantProps<typeof dashboardCardVariants>
