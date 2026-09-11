import type { PropsWithChildren } from 'react'

// Types
import type { TableProviderValue, TableProps } from '@/components/ui/Table/types'

// Query Context
import { TableContext } from '@/components/ui/Table/TableContext'

const NOOP_REFETCH = () => undefined

function TableProvider<T>({
  children,
  name,
  data: propData,
  serverData: propServerData,
  isLoading: propIsLoading,
  refetch = NOOP_REFETCH,
  ...props
}: PropsWithChildren<TableProps<T>>) {
  const resolvedServerData = propServerData
  const data = resolvedServerData?.items ?? propData ?? []

  const value: TableProviderValue<T> = {
    ...props,
    serverData: resolvedServerData,
    isLoading: propIsLoading ?? false,
    refetch,
    data,
    name,
  }

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export { TableProvider }
