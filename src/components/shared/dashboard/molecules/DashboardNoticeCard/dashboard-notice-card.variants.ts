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
    card: 'border-[#BFDBFE] bg-[#EFF6FF]',
    icon: 'bg-[#DBEAFE] text-[#155DFC]',
    title: 'text-[#1C398E]',
    description: 'text-[#1447E6]',
  },
} as const satisfies Record<DashboardNoticeCardVariant, DashboardNoticeCardVariantClassNames>
