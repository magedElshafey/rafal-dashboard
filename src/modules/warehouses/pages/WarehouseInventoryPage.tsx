import { useEffect } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { InventoryWorkspace, InventoryWorkspaceSkeleton } from '@/modules/inventory/components/InventoryWorkspace'
import { readInventoryPage } from '@/modules/inventory/utils/inventory-pagination'
import { useWarehouse } from '@/modules/warehouses/hooks/useWarehouse'
import { getLocalizedName } from '@/modules/cities/utils/city.utils'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { Routes } from '@/routes/routes'

function WarehouseInventoryContent() {
  const { t, i18n } = useTranslation()
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) && Number.isSafeInteger(Number(rawId)) ? Number(rawId) : null
  const query = useWarehouse(id, id !== null)
  const [search] = useSearchParams()
  const rawPage = search.get('page')
  const page = readInventoryPage(rawPage)
  const { forwardAddQuery } = useQuery()
  useEffect(() => {
    if (rawPage !== null && rawPage !== String(page)) forwardAddQuery({ page: String(page) }, { replace: true })
  }, [rawPage, page, forwardAddQuery])
  const notFound = id === null || (!query.data && isAxiosError(query.error) && query.error.response?.status === 404)
  const warehouse = query.data?.data
  const identityMismatch = Boolean(warehouse && warehouse.id !== id)
  return (
    <main className="min-w-0 space-y-4" dir={i18n.dir()}>
      <DashboardPageHeader
        title={t('inventory.warehouseTitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={Routes.inventory}>{t('inventory.backToDirectory')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={Routes.warehouses}>{t('inventory.manageWarehouses')}</Link>
            </Button>
          </div>
        }
      />
      {notFound ? (
        <EmptyState title={t('inventory.warehouseNotFound')} />
      ) : (
        <QueryStateBoundary
          isLoading={query.isLoading}
          isLoadingError={(query.isError && !query.data) || identityMismatch}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data) && !identityMismatch}
          onRetry={query.refetch}
          loadingFallback={
            <div aria-hidden className="space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
                <Skeleton className="h-8 w-56 max-w-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-10 w-full" />
              <InventoryWorkspaceSkeleton />
            </div>
          }
        >
          {warehouse && warehouse.id === id ? (
            <>
              <section
                className="space-y-3 rounded-xl border border-border bg-surface p-5"
                aria-label={t('inventory.fields.warehouse')}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="min-w-0 break-words text-xl font-semibold">
                    <bdi>{warehouse.name}</bdi>
                  </h2>
                  <Badge variant={warehouse.isActive ? 'success' : 'outline'}>
                    {t(warehouse.isActive ? 'warehouses.status.active' : 'warehouses.status.inactive')}
                  </Badge>
                </div>
                {warehouse.cities.length ? (
                  <dl>
                    <dt className="text-xs text-muted-foreground">{t('warehouses.fields.cities')}</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {warehouse.cities.map((city) => (
                        <Badge key={city.id} variant="secondary">
                          <bdi>{getLocalizedName(city.name, i18n.language)}</bdi>
                        </Badge>
                      ))}
                    </dd>
                  </dl>
                ) : null}
              </section>
              <InventoryWorkspace key={`${id}:${page}`} warehouseId={id} page={page} />
            </>
          ) : null}
        </QueryStateBoundary>
      )}
    </main>
  )
}

export default function WarehouseInventoryPage() {
  return (
    <QueryProvider>
      <WarehouseInventoryContent />
    </QueryProvider>
  )
}
