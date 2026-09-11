import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { IQueryContextProps, IQueryProviderProps, QueryInput, QueryRecord, QueryUpdateOptions } from './types'

export const defaultValues: IQueryContextProps = {
  routeQuery: false,
  query: null,
  addQuery: () => {},
  removeQuery: () => {},
  resetQueries: () => {},
  addRouteQuery: () => {},
  addRouteQueries: () => {},
  removeRouteQuery: () => {},
  resetRouteQueries: () => {},
  forwardAddQuery: () => {},
  forwardDeleteQuery: () => {},
  forwardResetQueries: () => {},
  resetAllQueries: () => {},
  resetAllRouteQueries: () => {},
  forwardResetAllQueries: () => {},
  replaceQueries: () => {},
  replaceRouteQueries: () => {},
  forwardReplaceQueries: () => {},
  forwardQuery: null,
}

export const QueryContext = createContext<IQueryContextProps>(defaultValues)

const EMPTY_RESET_QUERY_NAMES: string[] = []

const toQueryNameList = (queryName: string | string[]) => (Array.isArray(queryName) ? queryName : [queryName])

const hasQueryValue = (value: string | null | undefined): value is string =>
  value !== null && value !== undefined && value !== ''

const normalizeQueryRecord = (query: QueryInput | QueryRecord | undefined): QueryRecord => {
  const normalizedQuery: Record<string, string> = {}

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (hasQueryValue(value)) {
      normalizedQuery[key] = value
    }
  })

  return Object.keys(normalizedQuery).length ? normalizedQuery : null
}

const areQueriesEqual = (first: QueryRecord, second: QueryRecord) => {
  if (first === second) return true
  if (!first || !second) return !first && !second

  const firstKeys = Object.keys(first)
  const secondKeys = Object.keys(second)

  if (firstKeys.length !== secondKeys.length) return false

  return firstKeys.every((key) => first[key] === second[key])
}

const getResetQueryNames = (defaultResetQueryNames: string[], options?: QueryUpdateOptions) =>
  options?.resetQueryNames ?? defaultResetQueryNames

const applyResetQueryNames = (
  query: Record<string, string>,
  changedQueryNames: Set<string>,
  resetQueryNames: string[]
) => {
  resetQueryNames.forEach((name) => {
    if (!changedQueryNames.has(name)) {
      delete query[name]
    }
  })
}

const applyResetSearchParams = (
  searchParams: URLSearchParams,
  changedQueryNames: Set<string>,
  resetQueryNames: string[]
) => {
  resetQueryNames.forEach((name) => {
    if (!changedQueryNames.has(name)) {
      searchParams.delete(name)
    }
  })
}

const QueryProvider = ({
  children,
  isRouteQuery = true,
  initialQuery = null,
  onQueryChange,
  resetQueryNamesOnChange = EMPTY_RESET_QUERY_NAMES,
}: IQueryProviderProps) => {
  const [query, setQueryState] = useState<QueryRecord>(() => normalizeQueryRecord(initialQuery))
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const routeSearchParamsRef = useRef(new URLSearchParams(searchParams))
  const renderedSearchParamsKeyRef = useRef(searchParamsKey)

  if (renderedSearchParamsKeyRef.current !== searchParamsKey) {
    renderedSearchParamsKeyRef.current = searchParamsKey
    routeSearchParamsRef.current = new URLSearchParams(searchParams)
  }

  const resetQueryNamesKey = resetQueryNamesOnChange.join('\u0000')
  const defaultResetQueryNames = useMemo(
    () => (resetQueryNamesKey ? resetQueryNamesKey.split('\u0000') : EMPTY_RESET_QUERY_NAMES),
    [resetQueryNamesKey]
  )

  const setLocalQuery = useCallback(
    (updater: QueryInput | QueryRecord | ((prev: QueryRecord) => QueryInput | QueryRecord)) => {
      setQueryState((prev) => {
        const nextQuery = normalizeQueryRecord(typeof updater === 'function' ? updater(prev) : updater)

        if (areQueriesEqual(prev, nextQuery)) {
          return prev
        }

        onQueryChange?.(nextQuery)
        return nextQuery
      })
    },
    [onQueryChange]
  )

  useEffect(() => {
    if (isRouteQuery) return

    const nextQuery = normalizeQueryRecord(initialQuery)

    setQueryState((prev) => {
      if (areQueriesEqual(prev, nextQuery)) {
        return prev
      }

      return nextQuery
    })
  }, [initialQuery, isRouteQuery])

  const addQuery = useCallback(
    (newQuery: QueryInput, options?: QueryUpdateOptions) => {
      const changedQueryNames = new Set(Object.keys(newQuery))

      setLocalQuery((prev) => {
        const nextQuery = { ...(prev ?? {}) }

        applyResetQueryNames(nextQuery, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        Object.entries(newQuery).forEach(([key, value]) => {
          if (!hasQueryValue(value)) {
            delete nextQuery[key]
          } else {
            nextQuery[key] = value
          }
        })

        return nextQuery
      })
    },
    [defaultResetQueryNames, setLocalQuery]
  )

  const removeQuery = useCallback(
    (queryName: string | string[], options?: QueryUpdateOptions) => {
      const queryNames = toQueryNameList(queryName)
      const changedQueryNames = new Set(queryNames)

      setLocalQuery((prev) => {
        const nextQuery = { ...(prev ?? {}) }

        applyResetQueryNames(nextQuery, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        queryNames.forEach((name) => {
          delete nextQuery[name]
        })

        return nextQuery
      })
    },
    [defaultResetQueryNames, setLocalQuery]
  )

  const resetQueries = removeQuery

  const replaceQueries = useCallback(
    (managedQueryNames: string[], nextQuery: QueryInput | null, options?: QueryUpdateOptions) => {
      const managedQueryNamesSet = new Set(managedQueryNames)
      const changedQueryNames = new Set([
        ...managedQueryNames,
        ...Object.keys(nextQuery ?? {}).filter((name) => managedQueryNamesSet.has(name)),
      ])

      setLocalQuery((prev) => {
        const mergedQuery = { ...(prev ?? {}) }

        managedQueryNames.forEach((name) => {
          delete mergedQuery[name]
        })

        Object.entries(nextQuery ?? {}).forEach(([key, value]) => {
          if (managedQueryNamesSet.has(key) && hasQueryValue(value)) {
            mergedQuery[key] = value
          }
        })

        applyResetQueryNames(mergedQuery, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        return mergedQuery
      })
    },
    [defaultResetQueryNames, setLocalQuery]
  )

  const updateRouteSearchParams = useCallback(
    (updater: (currentParams: URLSearchParams) => URLSearchParams, options?: QueryUpdateOptions) => {
      const currentParams = new URLSearchParams(routeSearchParamsRef.current)
      const currentParamsKey = currentParams.toString()
      const nextParams = updater(currentParams)
      const nextParamsKey = nextParams.toString()

      if (nextParamsKey === currentParamsKey) {
        return
      }

      routeSearchParamsRef.current = new URLSearchParams(nextParams)
      setSearchParams(nextParams, options?.replace === undefined ? undefined : { replace: options.replace })
    },
    [setSearchParams]
  )

  const addRouteQueries = useCallback(
    (newQuery: QueryInput, options?: QueryUpdateOptions) => {
      const changedQueryNames = new Set(Object.keys(newQuery))

      updateRouteSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams)

        applyResetSearchParams(nextParams, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        Object.entries(newQuery).forEach(([key, value]) => {
          if (!hasQueryValue(value)) {
            nextParams.delete(key)
          } else {
            nextParams.set(key, value)
          }
        })

        return nextParams
      }, options)
    },
    [defaultResetQueryNames, updateRouteSearchParams]
  )

  const addRouteQuery = useCallback(
    (queryName: string, queryValue: string | null | undefined, options?: QueryUpdateOptions) => {
      addRouteQueries({ [queryName]: queryValue }, options)
    },
    [addRouteQueries]
  )

  const removeRouteQuery = useCallback(
    (queryName: string | string[], options?: QueryUpdateOptions) => {
      const queryNames = toQueryNameList(queryName)
      const changedQueryNames = new Set(queryNames)

      updateRouteSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams)

        applyResetSearchParams(nextParams, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        queryNames.forEach((name) => {
          nextParams.delete(name)
        })

        return nextParams
      }, options)
    },
    [defaultResetQueryNames, updateRouteSearchParams]
  )

  const resetRouteQueries = removeRouteQuery

  const replaceRouteQueries = useCallback(
    (managedQueryNames: string[], nextQuery: QueryInput | null, options?: QueryUpdateOptions) => {
      const managedQueryNamesSet = new Set(managedQueryNames)
      const changedQueryNames = new Set([
        ...managedQueryNames,
        ...Object.keys(nextQuery ?? {}).filter((name) => managedQueryNamesSet.has(name)),
      ])

      updateRouteSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams)

        managedQueryNames.forEach((name) => {
          const value = nextQuery?.[name]

          if (hasQueryValue(value)) {
            nextParams.set(name, value)
          } else {
            nextParams.delete(name)
          }
        })

        applyResetSearchParams(nextParams, changedQueryNames, getResetQueryNames(defaultResetQueryNames, options))

        return nextParams
      }, options)
    },
    [defaultResetQueryNames, updateRouteSearchParams]
  )

  const resetAllQueries = useCallback(() => {
    setLocalQuery(null)
  }, [setLocalQuery])

  const resetAllRouteQueries = useCallback(() => {
    updateRouteSearchParams(() => new URLSearchParams())
  }, [updateRouteSearchParams])

  const routeQueryRecord = useMemo(
    () => normalizeQueryRecord(Object.fromEntries(new URLSearchParams(searchParamsKey))),
    [searchParamsKey]
  )

  const forwardAddQuery = isRouteQuery ? addRouteQueries : addQuery
  const forwardDeleteQuery = isRouteQuery ? removeRouteQuery : removeQuery
  const forwardResetQueries = isRouteQuery ? resetRouteQueries : resetQueries
  const forwardResetAllQueries = isRouteQuery ? resetAllRouteQueries : resetAllQueries
  const forwardReplaceQueries = isRouteQuery ? replaceRouteQueries : replaceQueries
  const forwardQuery = isRouteQuery ? routeQueryRecord : query

  const contextValue = useMemo<IQueryContextProps>(
    () => ({
      routeQuery: isRouteQuery,
      query,
      addQuery,
      removeQuery,
      resetQueries,
      addRouteQuery,
      addRouteQueries,
      removeRouteQuery,
      resetRouteQueries,
      forwardAddQuery,
      forwardDeleteQuery,
      forwardResetQueries,
      resetAllQueries,
      resetAllRouteQueries,
      forwardResetAllQueries,
      replaceQueries,
      replaceRouteQueries,
      forwardReplaceQueries,
      forwardQuery,
    }),
    [
      isRouteQuery,
      query,
      addQuery,
      removeQuery,
      resetQueries,
      addRouteQuery,
      addRouteQueries,
      removeRouteQuery,
      resetRouteQueries,
      forwardAddQuery,
      forwardDeleteQuery,
      forwardResetQueries,
      resetAllQueries,
      resetAllRouteQueries,
      forwardResetAllQueries,
      replaceQueries,
      replaceRouteQueries,
      forwardReplaceQueries,
      forwardQuery,
    ]
  )

  return <QueryContext.Provider value={contextValue}>{children}</QueryContext.Provider>
}

export default QueryProvider
