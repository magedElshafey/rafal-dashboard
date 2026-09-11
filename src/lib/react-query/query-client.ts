import { QueryClient } from '@tanstack/react-query'
import { queryTimes } from './query-times'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: queryTimes.short,
      gcTime: queryTimes.long,

      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },

    mutations: {
      retry: 0,
    },
  },
})

let queryClientAuthBoundaryEpoch = 0

export function getQueryClientAuthBoundaryEpoch(): number {
  return queryClientAuthBoundaryEpoch
}

/**
 * Clear the current cache at an authenticated-identity boundary. The epoch
 * changes synchronously so lifecycle-scoped mutation writers (including the
 * Online Session controllers) can reject stale cache writes while still
 * running required cleanup callbacks. TanStack cannot cancel an already
 * executing mutation, so every mutation that writes after an await must opt in
 * to this epoch fence.
 */
export function clearQueryClientAtAuthBoundary(): void {
  queryClientAuthBoundaryEpoch += 1
  void queryClient.cancelQueries(undefined, { silent: true })
  queryClient.clear()
}
