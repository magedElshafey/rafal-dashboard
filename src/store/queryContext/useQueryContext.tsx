import { useContext } from 'react'
import { defaultValues, QueryContext } from './queryContext'

export const useQuery = () => {
  const context = useContext(QueryContext)
  if (context === undefined) {
    // Return a default value if no context is provided
    return defaultValues
  }
  return context
}
