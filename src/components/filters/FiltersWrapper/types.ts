import type { ReactNode } from 'react'
import type { QueryInput, QueryRecord } from '@/store/queryContext/types'

export interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  resetLabel?: ReactNode
  applyLabel?: ReactNode
  closeLabel?: string
  onCancel?: () => void
  onReset?: () => void
  onApply?: () => void
  className?: string
  bodyClassName?: string
}

export interface FiltersWrapperProps {
  /** Backward-compatible master switch for the trigger row. */
  showTrigger?: boolean
  /** Render the search control. Defaults to true while showTrigger is enabled. */
  showSearch?: boolean
  /** Render the drawer trigger. Defaults to true while showTrigger is enabled. */
  showFilterTrigger?: boolean
  searchName?: string
  searchPlaceholder?: string
  searchLabel?: string
  filterLabel?: ReactNode
  children?: ReactNode
  dialogTitle?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onFilter?: () => void
  onCancel?: () => void
  onReset?: () => void
  onApply?: (draftQuery: QueryRecord) => QueryInput | QueryRecord | void
  resetQueryNamesOnChange?: string[]
  resetLabel?: ReactNode
  applyLabel?: ReactNode
  closeLabel?: string
  className?: string
  searchClassName?: string
  buttonClassName?: string
  dialogClassName?: string
  dialogBodyClassName?: string
  filterNames?: string[]
}
