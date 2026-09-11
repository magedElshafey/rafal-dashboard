import { createContext, useContext } from 'react'

// Types
import type { TableProviderValue } from '@/components/ui/Table/types'

const TableContext = createContext<TableProviderValue<any> | null>(null)

export { TableContext }

export const useTableContext = () => {
  const context = useContext(TableContext)
  if (!context) throw "Can't use this Function outside TableContext"
  return context
}
