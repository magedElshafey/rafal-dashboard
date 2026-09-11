export type StatTileTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'green' | 'amber' | 'red' | 'dark'

export const statTileToneClassNames: Record<StatTileTone, string> = {
  primary: 'text-brand-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  neutral: 'text-content-primary',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-500',
  dark: 'text-dark-text',
}
