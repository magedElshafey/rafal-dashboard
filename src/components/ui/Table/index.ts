// Provider

// Context
export { useTableContext } from '@/components/ui/Table/TableContext'

// Custom Table Components
export { TableProvider } from '@/components/ui/Table/TableProvider'
export { TableHeader } from '@/components/ui/Table/TableHeader'
export { TableBody } from '@/components/ui/Table/TableBody'
export { TablePagination } from '@/components/ui/Table/TablePagination'
export { TableActionsDropdown } from '@/components/ui/Table/TableActionsDropdown'
export { TableAction } from '@/components/ui/Table/TableAction'

// Types
export type {
  TableProps,
  TableBodyProps,
  TableData,
  PaginationMeta,
  ITableHeader as TableHeaderType,
} from '@/components/ui/Table/types'
