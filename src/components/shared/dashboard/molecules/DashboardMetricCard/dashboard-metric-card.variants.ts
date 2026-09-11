export type DashboardMetricCardVariant = 'primary' | 'success' | 'warning' | 'error'

export const dashboardMetricCardVariants: Record<DashboardMetricCardVariant, string> = {
  primary: 'border-brand-100 text-brand-600',
  success: 'border-success-100 text-success-600',
  warning: 'border-warning-100 text-warning-600',
  error: 'border-error-100 text-error-600',
}
