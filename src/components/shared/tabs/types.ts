import type { ReactNode } from 'react'

export type BaseTabsVariant = 'segmented' | 'underline' | 'pills'

export type BaseTabItem<TValue extends string> = {
  value: TValue
  label: ReactNode
  icon?: ReactNode
  count?: number
  disabled?: boolean
}
