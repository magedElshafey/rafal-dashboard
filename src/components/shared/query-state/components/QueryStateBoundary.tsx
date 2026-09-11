import { QueryLoadingState } from '@/components/shared/query-state/components/QueryLoadingState'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { QueryStateBoundaryProps } from '@/components/shared/query-state/types/query-state.types'

export function QueryStateBoundary({
  children,
  loadingFallback,
  isLoading,
  isLoadingError,
  isRefetchError,
  isPaused,
  isFetching,
  hasData,
  onRetry,
}: QueryStateBoundaryProps) {
  const handleRetry = () => {
    void onRetry()
  }

  const shouldShowOfflineState = isPaused && !hasData

  const shouldShowLoadingState = isLoading && !hasData

  const shouldShowLoadingError = isLoadingError && !hasData

  const shouldShowRefetchError = isRefetchError && hasData

  if (shouldShowOfflineState) {
    return <QueryStateNotice kind="offline" isRetrying={isFetching} onRetry={handleRetry} />
  }

  if (shouldShowLoadingState) {
    return <QueryLoadingState fallback={loadingFallback} />
  }

  if (shouldShowLoadingError) {
    return <QueryStateNotice kind="loading-error" isRetrying={isFetching} onRetry={handleRetry} />
  }

  return (
    <>
      {shouldShowRefetchError ? (
        <QueryStateNotice kind="refetch-error" isRetrying={isFetching} onRetry={handleRetry} />
      ) : null}

      {children}
    </>
  )
}
