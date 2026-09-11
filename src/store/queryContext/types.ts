import type { PropsWithChildren } from 'react'

export type QueryRecord = Record<string, string> | null
export type QueryInput = Record<string, string | null | undefined>

export interface QueryUpdateOptions {
  resetQueryNames?: string[]
  replace?: boolean
}

export interface IQueryContextProps {
  // States
  routeQuery: boolean
  query: QueryRecord

  // Query Methods
  addQuery: (newQuery: QueryInput, options?: QueryUpdateOptions) => void
  removeQuery: (queryName: string | string[], options?: QueryUpdateOptions) => void
  resetQueries: (queryName: string | string[], options?: QueryUpdateOptions) => void
  resetAllQueries: () => void

  // Route Query Methods
  addRouteQuery: (queryName: string, queryValue: string | null | undefined, options?: QueryUpdateOptions) => void
  addRouteQueries: (newQuery: QueryInput, options?: QueryUpdateOptions) => void
  removeRouteQuery: (queryName: string | string[], options?: QueryUpdateOptions) => void
  resetRouteQueries: (queryName: string | string[], options?: QueryUpdateOptions) => void
  resetAllRouteQueries: () => void

  // Forward Query Methods
  forwardAddQuery: (query: QueryInput, options?: QueryUpdateOptions) => void
  forwardDeleteQuery: (queryName: string | string[], options?: QueryUpdateOptions) => void
  forwardResetQueries: (queryName: string | string[], options?: QueryUpdateOptions) => void
  forwardResetAllQueries: () => void
  forwardQuery: QueryRecord
  replaceQueries: (managedQueryNames: string[], nextQuery: QueryInput | null, options?: QueryUpdateOptions) => void
  replaceRouteQueries: (managedQueryNames: string[], nextQuery: QueryInput | null, options?: QueryUpdateOptions) => void
  forwardReplaceQueries: (
    managedQueryNames: string[],
    nextQuery: QueryInput | null,
    options?: QueryUpdateOptions
  ) => void
}

export interface IQueryProviderProps extends PropsWithChildren {
  isRouteQuery?: boolean
  initialQuery?: QueryRecord
  onQueryChange?: (query: QueryRecord) => void
  resetQueryNamesOnChange?: string[]
}
