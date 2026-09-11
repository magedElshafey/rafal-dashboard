export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'primary' | 'neutral' | 'info' | 'purple'

export const statusBadgeVariants: Record<StatusBadgeVariant, string> = {
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  primary: 'bg-brand-50 text-brand-700',
  neutral: 'bg-surface-muted text-content-tertiary',
  info: 'bg-info-50 text-info-600',
  purple: 'bg-accent text-accent-foreground',
}
