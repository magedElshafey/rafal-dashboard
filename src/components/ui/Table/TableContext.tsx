import { createContext, useContext } from 'react'

// Types
import type { TableProviderValue } from '@/components/ui/Table/types'

const TableContext = createContext<TableProviderValue<unknown> | null>(null)

export { TableContext }

export const useTableContext = <T = unknown,>() => {
  const context = useContext(TableContext)
  if (!context) throw new Error('useTableContext must be used within TableProvider')
  return context as TableProviderValue<T>
}
