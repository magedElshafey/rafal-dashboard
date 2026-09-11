export type StatTileTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'green' | 'amber' | 'red' | 'dark'

export const statTileToneClassNames: Record<StatTileTone, string> = {
  primary: 'text-brand-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  neutral: 'text-content-primary',
  green: 'text-success',
  amber: 'text-warning',
  red: 'text-destructive',
  dark: 'text-dark-text',
}
