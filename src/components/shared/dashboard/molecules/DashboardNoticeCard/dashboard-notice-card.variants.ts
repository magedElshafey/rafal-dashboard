export type DashboardNoticeCardVariant = 'warning' | 'info' | 'success' | 'brand'

type DashboardNoticeCardVariantClassNames = {
  card: string
  icon: string
  title: string
  description: string
}

export const dashboardNoticeCardVariants = {
  warning: {
    card: 'border-warning-200 bg-warning-50/40',
    icon: 'bg-warning-50 text-warning-500',
    title: 'text-warning-600',
    description: 'text-warning-600',
  },
  info: {
    card: 'border-info-200 bg-info-50/40',
    icon: 'bg-info-50 text-info-500',
    title: 'text-info-600',
    description: 'text-info-600',
  },
  success: {
    card: 'border-success-200 bg-success-50/40',
    icon: 'bg-success-50 text-success-500',
    title: 'text-success-600',
    description: 'text-success-600',
  },
  brand: {
    card: 'border-primary/20 bg-accent',
    icon: 'bg-primary/15 text-primary',
    title: 'text-accent-foreground',
    description: 'text-accent-foreground',
  },
} as const satisfies Record<DashboardNoticeCardVariant, DashboardNoticeCardVariantClassNames>
