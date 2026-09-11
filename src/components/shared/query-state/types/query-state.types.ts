import type { ReactNode } from 'react'

export type QueryStateBoundaryProps = {
  children: ReactNode
  loadingFallback: ReactNode

  isLoading: boolean
  isLoadingError: boolean
  isRefetchError: boolean
  isPaused: boolean
  isFetching: boolean
  hasData: boolean

  onRetry: () => void | Promise<unknown>
}

export type QueryStateNoticeKind = 'offline' | 'loading-error' | 'refetch-error'
