import { Package, RefreshCw } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import PaginatedListFooter from '@/components/shared/pagination/PaginatedListFooter'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { InventoryList } from '@/modules/inventory/components/InventoryList'
import { InventoryOverview } from '@/modules/inventory/components/InventoryOverview'
import { QuickStocktakeDrawer } from '@/modules/inventory/components/QuickStocktakeDrawer'
import { useInventory } from '@/modules/inventory/hooks/useInventory'
import type { InventoryStock } from '@/modules/inventory/types/inventory.types'
import { inventoryPagination } from '@/modules/inventory/utils/inventory-pagination'
import { resolveAppLocale } from '@/utils/date/date.helpers'

export function InventoryWorkspace({ warehouseId, page }: { warehouseId: number; page: number }) {
  const { t, i18n } = useTranslation()
  const query = useInventory(warehouseId, page)
  const { forwardAddQuery } = useQuery()
  const correctedPage =
    query.data && page > query.data.meta.last_page
      ? Math.min(query.data.meta.current_page, query.data.meta.last_page)
      : page
  useEffect(() => {
    if (correctedPage !== page) forwardAddQuery({ page: String(correctedPage) }, { replace: true })
  }, [correctedPage, page, forwardAddQuery])
  const numbers = new Intl.NumberFormat(resolveAppLocale(i18n.language), { maximumFractionDigits: 20 })
  const [stocktake, setStocktake] = useState<InventoryStock | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const refresh = useRef<HTMLButtonElement>(null)
  const refreshDescriptionId = useId()
  useEffect(() => {
    if (!stocktake && trigger.current) {
      if (trigger.current.isConnected) trigger.current.focus()
      else refresh.current?.focus()
      trigger.current = null
    }
  }, [stocktake])
  const header = <h2 className="font-semibold">{t('inventory.listTitle')}</h2>

  return (
    <section className="min-w-0 space-y-4" aria-label={t('inventory.listTitle')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('inventory.workspaceDescription')}</p>
        <Button
          ref={refresh}
          variant="outline"
          className="min-w-44"
          disabled={query.isFetching}
          aria-describedby={refreshDescriptionId}
          onClick={() => void query.refetch()}
        >
          <RefreshCw aria-hidden className={query.isFetching ? 'motion-safe:animate-spin' : undefined} />
          <span aria-live="polite">{t(query.isFetching ? 'inventory.refreshing' : 'inventory.refresh')}</span>
        </Button>
        <span id={refreshDescriptionId} className="sr-only">
          {t('inventory.refreshDescription')}
        </span>
      </div>
      <QueryStateBoundary
        isLoading={query.isLoading || correctedPage !== page}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data) && correctedPage === page}
        onRetry={query.refetch}
        loadingFallback={<InventoryWorkspaceSkeleton />}
      >
        {query.data ? (
          <>
            <InventoryOverview data={query.data} />
            <ResponsiveDataLayout
              header={
                <div>
                  {header}
                  <p className="text-sm text-muted-foreground">
                    {t('inventory.page', {
                      current: numbers.format(query.data.meta.current_page),
                      total: numbers.format(query.data.meta.last_page),
                    })}
                  </p>
                </div>
              }
              isEmpty={query.data.items.length === 0}
              empty={
                <EmptyState
                  icon={<Package />}
                  title={t(query.data.meta.total === 0 ? 'inventory.empty.title' : 'inventory.emptyPage.title')}
                  description={t(
                    query.data.meta.total === 0 ? 'inventory.empty.description' : 'inventory.emptyPage.description'
                  )}
                />
              }
            >
              <InventoryList
                items={query.data.items}
                onStocktake={(stock) => {
                  trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
                  setStocktake(stock)
                }}
              />
            </ResponsiveDataLayout>
            <p className="text-sm text-muted-foreground">
              {t('inventory.threshold', { threshold: numbers.format(query.data.meta.low_stock_threshold) })}
            </p>
            <PaginatedListFooter
              pagination={inventoryPagination(query.data)}
              itemCount={query.data.items.length}
              showSinglePage
              getRangeLabel={({ start, end, total }) =>
                t('inventory.range', {
                  start: numbers.format(start),
                  end: numbers.format(end),
                  total: numbers.format(total),
                })
              }
            />
          </>
        ) : null}
      </QueryStateBoundary>
      {stocktake ? (
        <QuickStocktakeDrawer key={stocktake.id} stock={stocktake} onClose={() => setStocktake(null)} />
      ) : null}
    </section>
  )
}

export function InventoryWorkspaceSkeleton() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <InventoryOverview />
      <ResponsiveDataLayout
        header={
          <div>
            <h2 className="font-semibold">{t('inventory.listTitle')}</h2>
            <Skeleton aria-hidden className="h-5 w-28" />
          </div>
        }
        isEmpty={false}
        empty={null}
      >
        <InventoryList items={[]} loading />
      </ResponsiveDataLayout>
      <Skeleton aria-hidden className="h-5 w-96 max-w-full" />
      <div
        aria-hidden
        className="flex min-h-24 flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5"
      >
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-10 w-64 max-w-full" />
      </div>
    </div>
  )
}
