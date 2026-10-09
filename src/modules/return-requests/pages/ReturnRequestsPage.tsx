import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FiltersWrapper from '@/components/filters/FiltersWrapper'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { ReturnRequestFilters } from '../components/ReturnRequestFilters'
import { ReturnRequestsList, ReturnRequestsListSkeleton } from '../components/ReturnRequestsList'
import { useReturnRequests } from '../hooks/useReturnRequests'
import {
  readReturnRequestsFilters,
  returnRequestFilterNames,
  validReturnRequestsDateRange,
} from '../utils/return-request-filters'

function ReturnRequestsContent() {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const filters = readReturnRequestsFilters(forwardQuery)
  const query = useReturnRequests(filters)
  const [showFilterValidation, setShowFilterValidation] = useState(false)
  const requests = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader title={t('returnRequests.title')} />
      <FiltersWrapper
        showSearch={false}
        filterNames={returnRequestFilterNames}
        resetQueryNamesOnChange={['page']}
        dialogTitle={t('returnRequests.filters.title')}
        onFilter={() => setShowFilterValidation(false)}
        onReset={() => setShowFilterValidation(false)}
        onApply={(draftQuery) => {
          const valid = validReturnRequestsDateRange(readReturnRequestsFilters(draftQuery))
          setShowFilterValidation(!valid)
          return valid ? undefined : false
        }}
      >
        <ReturnRequestFilters showValidation={showFilterValidation} />
      </FiltersWrapper>
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<ReturnRequestsListSkeleton />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        <TableProvider name="return-requests" data={requests} isLoading={query.isLoading} refetch={query.refetch}>
          <ResponsiveDataLayout
            header={<h2 className="font-semibold">{t('returnRequests.listTitle', { count: requests.length })}</h2>}
            isEmpty={requests.length === 0}
            empty={<EmptyState title={t('returnRequests.empty')} description={t('returnRequests.emptyDescription')} />}
          >
            <ReturnRequestsList requests={requests} />
            {query.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={query.isFetchingNextPage}
                  onRetry={() => void query.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {query.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('returnRequests.loading')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
    </main>
  )
}

export default function ReturnRequestsPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <ReturnRequestsContent />
    </QueryProvider>
  )
}
