export type DashboardStatCardVariant = 'primary' | 'success' | 'warning' | 'error' | 'purple'

export const dashboardStatCardVariants: Record<
  DashboardStatCardVariant,
  {
    value: string
    icon: string
  }
> = {
  primary: {
    value: 'text-neutral-900',
    icon: 'bg-brand-50 text-brand-500',
  },
  success: {
    value: 'text-success-600',
    icon: 'bg-transparent text-success-600',
  },
  warning: {
    value: 'text-warning-600',
    icon: 'bg-warning-50 text-warning-600',
  },
  error: {
    value: 'text-error-600',
    icon: 'bg-error-50 text-error-600',
  },
  purple: {
    value: 'text-primary',
    icon: 'bg-transparent text-primary',
  },
}
