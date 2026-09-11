// Hooks
import useFetch from '@/hooks/useFetch'
import { useEffect, PropsWithChildren } from 'react'

// Store
import { useQuery } from '@/store/queryContext/useQueryContext'

// Utils
import { observer } from '@/utils/observer'

// Types
import type { TableData, TableProviderValue, TableProps } from '@/components/ui/Table/types'

// Query Context
import { TableContext } from '@/components/ui/Table/TableContext'

function TableProvider<T>({
  children,
  reqName,
  name,
  data: propData,
  serverData: propServerData,
  isLoading: propIsLoading,
  ...props
}: PropsWithChildren<TableProps<T>>) {
  const { forwardQuery } = useQuery()

  const query = forwardQuery || {}

  const {
    data: serverData,
    isLoading,
    refetch,
  } = useFetch<TableData<T>>({
    reqName,
    query,
    options: {
      enabled: !!reqName,
      select: (res) => {
        return res?.data
      },
    },
    queryKey: reqName ? [reqName, query] : ['static-data'],
  })

  // Data processing logic from useTableData
  const resolvedServerData = propServerData ?? serverData
  const data = resolvedServerData?.items ?? propData ?? []

  const value: TableProviderValue<T> = {
    ...props,
    serverData: resolvedServerData,
    isLoading: propIsLoading ?? isLoading,
    refetch,
    data,
    name,
  }

  useEffect(() => {
    if (reqName) {
      // Subscribe to refetch events
      observer.subscribe(name ? `${name}-refetch` : 'refetch', refetch)
    }
    return () => {
      if (reqName) {
        // Unsubscribe from refetch events
        observer.unsubscribe('refetch')
      }
    }
  }, [])

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export { TableProvider }
