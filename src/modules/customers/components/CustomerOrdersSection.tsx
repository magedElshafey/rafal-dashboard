import { useId } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { useCustomerOrders } from '../hooks/useCustomerOrders'
import { CustomerOrdersList } from './CustomerOrdersList'

export function CustomerOrdersSection({ customerId, profileReady }: { customerId: number; profileReady: boolean }) {
  const { t } = useTranslation()
  const titleId = useId()
  const query = useCustomerOrders(customerId)
  const orders = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages.at(-1)?.paginate.total
  const loadMore = () => query.fetchNextPage({ cancelRefetch: false })
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(
      profileReady && query.hasNextPage && !query.isFetching && !query.isFetchNextPageError && !query.isRefetchError
    ),
    onLoadMore: loadMore,
    operationKey: `${customerId}-${query.data?.pages.length}`,
  })
  return (
    <ResponsiveDataLayout
      aria-labelledby={titleId}
      header={
        <div className="min-w-0 space-y-1">
          <h2 id={titleId} className="text-lg font-semibold">
            {t('customers.orders.title')}
          </h2>
          <div className="min-h-5 text-sm text-muted-foreground">
            {total !== undefined ? (
              t('customers.orders.total', { count: total })
            ) : query.isLoading ? (
              <Skeleton aria-hidden="true" className="h-5 w-24" />
            ) : (
              '—'
            )}
          </div>
        </div>
      }
      isEmpty={false}
      empty={null}
    >
      <QueryStateBoundary
        loadingFallback={<CustomerOrdersList />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {orders.length ? (
          <CustomerOrdersList orders={orders} />
        ) : (
          <EmptyState
            variant="compact"
            icon={<ShoppingBag />}
            title={t('customers.orders.empty.title')}
            description={t('customers.orders.empty.description')}
          />
        )}
        {query.isFetchNextPageError ? (
          <div className="p-4">
            <QueryStateNotice
              kind="refetch-error"
              isRetrying={query.isFetchingNextPage}
              onRetry={() => void loadMore()}
            />
          </div>
        ) : null}
      </QueryStateBoundary>
      <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
        {query.hasNextPage && !query.isFetchNextPageError ? (
          <Button
            variant="outline"
            disabled={!profileReady || query.isFetching || query.isRefetchError}
            onClick={() => void loadMore()}
          >
            {t(query.isFetchingNextPage ? 'customers.orders.loadingMore' : 'customers.orders.loadMore')}
          </Button>
        ) : null}
      </div>
    </ResponsiveDataLayout>
  )
}
