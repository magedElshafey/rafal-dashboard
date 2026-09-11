import { Fragment, useCallback } from 'react'

// utils
import { cn } from '@/lib/utils'

// context
import { useTableContext } from '@/components/ui/Table/TableContext'

// ui components
import { ShadcnTableBody as TableBodyShadcn, TableCell, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// hooks
import { useTranslation } from 'react-i18next'

// types
import type { TableBodyProps } from '@/components/ui/Table/types'

const TableBody = ({ render, columnCount = 1000, emptyMessage, ...props }: TableBodyProps) => {
  const { t } = useTranslation()

  const { isLoading, data, serverData, name } = useTableContext()
  /**
   * Calculates the sequential row number for paginated data.
   * This ensures that row numbers continue from the previous page,
   * providing a continuous count across all pages.
   */
  const getRowCount = useCallback(
    (index: number) => {
      return ((serverData?.paginate?.current_page ?? 1) - 1) * (serverData?.paginate?.per_page ?? 10) + index + 1
    },
    [serverData?.paginate?.current_page, serverData?.paginate?.per_page]
  )

  if (isLoading) {
    return <LoadingTableRow columnCount={columnCount} />
  }

  if (data?.length === 0) {
    return <NoDataTableRow columnCount={columnCount} message={emptyMessage ?? t('table.no_results')} />
  }

  // If render prop is provided, use render prop pattern
  // using TableRow and TableCell components from shadcn/ui from ui/table.tsx
  return (
    <TableBodyShadcn className={cn('bg-transparent space-y-2 pb-1')} {...props}>
      {data.map((item, index: number) => (
        <Fragment key={`${name}-${index}-data`}>
          {render?.({
            item,
            index,
            row_count: getRowCount(index),
          })}
        </Fragment>
      ))}
    </TableBodyShadcn>
  )
}

export { TableBody }

const NoDataTableRow = ({ columnCount, message }: { columnCount: number; message: string }) => {
  return (
    <TableBodyShadcn className={cn('bg-transparent space-y-2 pb-1')}>
      <TableRow>
        <TableCell colSpan={columnCount} className="text-center p-10">
          {message}
        </TableCell>
      </TableRow>
    </TableBodyShadcn>
  )
}

const LoadingTableRow = ({ columnCount }: { columnCount: number }) => {
  return (
    <TableBodyShadcn className={cn('bg-transparent space-y-2 pb-1')}>
      {Array.from({ length: 3 }, (_, index) => (
        <TableRow key={`loading-${index}`} className="group">
          {Array.from({ length: columnCount }, (_, index) => (
            <TableCell key={`loading-${index}`} className="text-start">
              <Skeleton className="w-28 rounded-[5px] h-3 bg-gray-400" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBodyShadcn>
  )
}
