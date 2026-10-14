import { Warehouse, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'
import { Routes } from '@/routes/routes'

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
        <li key={warehouse?.id ?? index}>
          <DashboardCard padding="lg" className="flex h-full min-w-0 flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <Warehouse className="size-6 shrink-0 text-primary" aria-hidden />
              {warehouse ? (
                <Badge variant={warehouse.isActive ? 'success' : 'outline'}>
                  {t(warehouse.isActive ? 'warehouses.status.active' : 'warehouses.status.inactive')}
                </Badge>
              ) : (
                <Skeleton className="h-6 w-20" />
              )}
            </div>
            {warehouse ? (
              <h2 className="min-w-0 break-words text-lg font-semibold">
                <bdi>{warehouse.name}</bdi>
              </h2>
            ) : (
              <Skeleton className="h-7 w-48 max-w-full" />
            )}
            <div className="mt-auto">
              {warehouse ? (
                <Button asChild className="h-11 w-full">
                  <Link
                    to={Routes.warehouseInventoryPath(warehouse.id)}
                    aria-label={t('inventory.warehouseActionNamed', { name: warehouse.name })}
                  >
                    {t('inventory.warehouseAction')}
                    <ArrowRight className="rtl:rotate-180" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Skeleton className="h-11 w-full" />
              )}
            </div>
          </DashboardCard>
        </li>
      ))}
    </ul>
  )
  return (
    <main className="min-w-0 space-y-4" dir={i18n.dir()}>
      <DashboardPageHeader
        title={t('inventory.title')}
        description={t('inventory.description')}
        actions={
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
            {t('inventory.refreshDirectory')}
          </Button>
        }
      />
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
