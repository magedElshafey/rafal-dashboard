export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'error'

export const progressBarVariants: Record<ProgressBarVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  purple: 'bg-primary',
  error: 'bg-destructive',
}

export function getProgressBarPercentageColor(value: number): string {
  if (value <= 0) return 'bg-muted-foreground'
  if (value <= 20) return 'bg-destructive'
  if (value <= 60) return 'bg-warning'
  if (value < 100) return 'bg-primary'

  return 'bg-success'
}
