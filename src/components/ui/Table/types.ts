// Types
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react'

// Table Variants
import { tableVariants } from '@/components/ui/Table/TableAction'

// ui components
import { Button } from '@/components/ui/button'

export interface ITableHeader {
  title: string
  sortKey?: string
}

export interface TableProps<T = any> {
  name?: string
  data?: T[]
  serverData?: TableData<T>
  reqName?: string
  isLoading?: boolean
}

export interface PaginationMeta {
  current_page: number
  count?: number
  per_page: number
  total: number
  total_pages: number
}

export type TableData<T> = {
  items: T[]
  paginate: PaginationMeta
}

export type TableActionVariant = keyof typeof tableVariants

export interface TableActionProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  tableActionVariant?: TableActionVariant
  permissionName?: string
}

export interface TableProviderValue<T> extends TableProps<T> {
  serverData: TableData<T> | undefined // full data from the server
  isLoading: boolean
  refetch: () => void
  data: T[] // data items  from the server or the data passed to the table
  name: string | undefined
}

export interface TableHeaderProps extends PropsWithChildren<ComponentProps<'thead'>> {
  headers?: ITableHeader[]
}

export interface TableBodyProps extends ComponentProps<'tbody'> {
  render: (value: { item: any; index: number; row_count: number }) => ReactNode
  columnCount: number
  emptyMessage?: string
}

export interface TablePaginationProps extends ComponentProps<'div'> {
  onPageChange?: (page: number) => void
}

export interface ISortableHeaderBtnProps extends ComponentProps<'button'> {
  title: string
  sortKey: string
}

// export interface TableActionsDropdownProps extends ComponentProps<'div'> {
//   triggerLabel?: string
// }

export interface TableActionsDropdownProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  triggerLabel?: string
  children: React.ReactNode
  className?: string
}
