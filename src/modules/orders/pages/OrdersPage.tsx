import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FiltersWrapper from '@/components/filters/FiltersWrapper'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { useOrders, useOrderStatuses } from '../hooks/useOrders'
import { OrderFilters } from '../components/OrderFilters'
import { OrdersList, OrdersListSkeleton } from '../components/OrdersList'
import { orderFilterNames, readOrdersFilters, validOrdersDateRange } from '../utils/order-filters'

function OrdersContent() {
  const { t } = useTranslation()
  const { forwardQuery, forwardResetQueries } = useQuery()
  const [resetVersion, setResetVersion] = useState(0)
  const filters = readOrdersFilters(forwardQuery)
  const validDates = validOrdersDateRange(filters)
  const query = useOrders(filters)
  const statuses = useOrderStatuses()
  const orders = query.data?.pages.flatMap((page) => page.items) ?? []
  const reset = () => {
    forwardResetQueries(['search', ...orderFilterNames, 'page'])
    setResetVersion((value) => value + 1)
  }
  const loadMore = () => query.fetchNextPage({ cancelRefetch: false })
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isFetchNextPageError),
    onLoadMore: loadMore,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader title={t('orders.title')} />
      <FiltersWrapper
        key={resetVersion}
        filterNames={orderFilterNames}
        resetQueryNamesOnChange={['page']}
        searchLabel={t('orders.search')}
        searchPlaceholder={t('orders.search')}
        dialogTitle={t('orders.filters')}
        onReset={reset}
      >
        <OrderFilters />
      </FiltersWrapper>
      <Button variant="outline" onClick={reset}>
        {t('orders.reset')}
      </Button>
      {!validDates && <p role="alert">{t('orders.invalidDates')}</p>}
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<OrdersListSkeleton />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        <TableProvider name="orders" data={orders} isLoading={query.isLoading} refetch={query.refetch}>
          <ResponsiveDataLayout
            header={
              <h2 className="font-semibold">
                {t('orders.listTitle', { count: query.data?.pages[0]?.paginate.total ?? 0 })}
              </h2>
            }
            isEmpty={orders.length === 0}
            empty={
              <EmptyState
                title={t('orders.empty')}
                description={t('orders.emptyDescription')}
                primaryAction={
                  <Button variant="outline" onClick={reset}>
                    {t('orders.reset')}
                  </Button>
                }
              />
            }
          >
            <OrdersList orders={orders} definitions={statuses.data ?? []} />
            {query.isFetchNextPageError && (
              <QueryStateNotice
                kind="refetch-error"
                onRetry={() => void loadMore()}
                isRetrying={query.isFetchingNextPage}
              />
            )}
            <div ref={loadMoreRef} className="flex min-h-8 justify-center p-4" aria-live="polite">
              {query.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('orders.loadingMore')}</span>
                  <Skeleton className="h-8 w-40" aria-hidden="true" />
                </>
              ) : query.hasNextPage && !query.isFetchNextPageError ? (
                <Button variant="outline" onClick={() => void loadMore()} disabled={query.isFetching}>
                  {t('orders.loadMore')}
                </Button>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
    </main>
  )
}
export default function OrdersPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <OrdersContent />
    </QueryProvider>
  )
}
