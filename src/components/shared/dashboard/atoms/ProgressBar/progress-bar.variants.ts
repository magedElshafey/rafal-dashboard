export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'error'

export const progressBarVariants: Record<ProgressBarVariant, string> = {
  primary: 'bg-black-400',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  info: 'bg-info-600',
  purple: 'bg-[#9810FA]',
  error: 'bg-error-500',
}

export function getProgressBarPercentageColor(value: number): string {
  if (value <= 0) return 'bg-neutral-600'
  if (value <= 20) return 'bg-error-500'
  if (value <= 40) return 'bg-orange-500'
  if (value <= 60) return 'bg-yellow-500'
  if (value < 100) return 'bg-brand-500'

  return 'bg-success-600'
}
