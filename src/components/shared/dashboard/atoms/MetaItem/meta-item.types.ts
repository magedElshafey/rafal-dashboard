import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import type { InfoRowProps } from '@/components/shared/data-display/InfoRow'

export type MetaItemProps = Omit<InfoRowProps, 'label' | 'value' | 'labelClassName'> & {
  icon?: LucideIcon
  label?: ReactNode
  value: ReactNode
  iconClassName?: string
  labelTextClassName?: string
  labelContainerClassName?: string
  rowLabelClassName?: InfoRowProps['labelClassName']
}
