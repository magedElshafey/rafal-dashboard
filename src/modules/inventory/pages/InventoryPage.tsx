import { Warehouse, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'
import { WarehouseDirectoryCard } from '@/modules/inventory/components/WarehouseDirectoryCard'

export default function InventoryPage() {
  const { t, i18n } = useTranslation()
  const query = useWarehouses()
  const warehouses = query.data?.pages.flatMap((page) => page.items) ?? []
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isFetchNextPageError),
    onLoadMore: () => query.fetchNextPage({ cancelRefetch: false }),
    operationKey: query.data?.pages.length,
  })
  const cards = (loading: boolean) => (
    <ul
      aria-label={t('inventory.directoryTitle')}
      aria-hidden={loading || undefined}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {(loading ? Array.from({ length: 6 }, () => null) : warehouses).map((warehouse, index) => (
        <li key={warehouse?.id ?? index} className="min-w-0">
          <WarehouseDirectoryCard warehouse={warehouse} />
        </li>
      ))}
    </ul>
  )
  return (
    <main className="min-w-0 space-y-4" dir={i18n.dir()}>
      <DashboardPageHeader
        title={t('inventory.title')}
        description={t('inventory.directoryPageDescription')}
        actions={
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw
              aria-hidden
              className={query.isFetching && !query.isFetchingNextPage ? 'motion-safe:animate-spin' : undefined}
            />
            <span aria-live="polite">
              {t(
                query.isFetching && !query.isFetchingNextPage
                  ? 'inventory.refreshingDirectory'
                  : 'inventory.refreshDirectory'
              )}
            </span>
          </Button>
        }
      />
      <div className="space-y-1 border-t border-border-subtle pt-5">
        <h2 className="text-lg font-semibold">{t('inventory.directoryHeading')}</h2>
        <p className="text-sm text-muted-foreground">{t('inventory.description')}</p>
      </div>
      <QueryStateBoundary
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
        loadingFallback={cards(true)}
      >
        {warehouses.length ? (
          cards(false)
        ) : (
          <EmptyState
            icon={<Warehouse />}
            title={t('warehouses.empty.title')}
            description={t('inventory.directoryEmpty')}
          />
        )}
        {query.isFetchNextPageError ? (
          <QueryStateNotice
            kind="refetch-error"
            isRetrying={query.isFetchingNextPage}
            onRetry={() => void query.fetchNextPage()}
          />
        ) : null}
        <div ref={loadMoreRef} className="flex min-h-12 justify-center" aria-live="polite">
          {query.hasNextPage && !query.isFetchNextPageError ? (
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage({ cancelRefetch: false })}
            >
              {t(query.isFetchingNextPage ? 'warehouses.loadingMore' : 'inventory.loadMoreWarehouses')}
            </Button>
          ) : null}
        </div>
      </QueryStateBoundary>
    </main>
  )
}
