import { useEffect, useMemo, useState } from 'react'

import { searchGlobally } from '../api/global-search.api'
import { GLOBAL_SEARCH_DEBOUNCE_MS, GLOBAL_SEARCH_MIN_QUERY_LENGTH } from '../constants/global-search.constants'
import type { GlobalSearchResult } from '../types/global-search.types'

type GlobalSearchStatus = 'idle' | 'loading' | 'success' | 'error'

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [status, setStatus] = useState<GlobalSearchStatus>('idle')

  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= GLOBAL_SEARCH_MIN_QUERY_LENGTH

  useEffect(() => {
    let isActive = true

    if (!canSearch) {
      setResults([])
      setStatus('idle')
      return
    }

    setStatus('loading')

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await searchGlobally(normalizedQuery)

        if (!isActive) return

        setResults(data)
        setStatus('success')
      } catch {
        if (!isActive) return

        setResults([])
        setStatus('error')
      }
    }, GLOBAL_SEARCH_DEBOUNCE_MS)

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [normalizedQuery, canSearch])

  return {
    results,
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    canSearch,
  }
}
