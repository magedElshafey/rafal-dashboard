export type ProgressRingVariant = 'primary' | 'success' | 'warning' | 'info' | 'error' | 'purple'

export const progressRingVariants: Record<ProgressRingVariant, string> = {
  primary: 'text-brand-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  info: 'text-info-600',
  error: 'text-error-500',
  purple: 'text-[#9810FA]',
}
