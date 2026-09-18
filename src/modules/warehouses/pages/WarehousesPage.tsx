import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Warehouse as WarehouseIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { useEntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { WarehouseDrawer } from '@/modules/warehouses/components/WarehouseDrawer'
import { WarehousesList } from '@/modules/warehouses/components/WarehousesList'
import { WarehousesListSkeleton } from '@/modules/warehouses/components/WarehousesListSkeleton'
import { useDeleteWarehouse } from '@/modules/warehouses/hooks/useDeleteWarehouse'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'

function WarehousesPage() {
  const { t } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const query = useWarehouses()
  const deleteWarehouse = useDeleteWarehouse()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null)
  const warehouses = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? warehouses.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })

  useEffect(() => {
    if (warehouseToDelete) alertRef.current?.handleOpen(true)
  }, [warehouseToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('warehouses.createWarehouse')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('warehouses.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('warehouses.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<WarehousesListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!warehouseToDelete || deleteWarehouse.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteWarehouse.mutateAsync(warehouseToDelete.id)
      alertRef.current?.close()
      setWarehouseToDelete(null)
    } catch {
      // Localized mutation feedback is owned by the hook; keep the dialog open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('warehouses.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={warehouses.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={warehouses} isLoading={query.isLoading} refetch={query.refetch} name="warehouses">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={warehouses.length === 0}
            empty={
              <EmptyState
                icon={<WarehouseIcon />}
                title={t('warehouses.empty.title')}
                description={t('warehouses.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <WarehousesList
              warehouses={warehouses}
              onEdit={(item) => drawer.openEdit(item.id)}
              onDelete={setWarehouseToDelete}
              actionsDisabled={deleteWarehouse.isPending}
            />
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
                  <span className="sr-only">{t('warehouses.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <WarehouseDrawer
        open={drawer.open}
        mode={drawer.mode}
        warehouseId={drawer.entityId}
        onOpenChange={drawer.setOpen}
      />
      <DeleteAlert
        ref={alertRef}
        title={t('warehouses.delete.title')}
        body={t('warehouses.delete.description', { name: warehouseToDelete?.name ?? '' })}
        confirmLabel={t('warehouses.actions.delete')}
        cancelLabel={t('warehouses.actions.cancel')}
        pendingLabel={t('warehouses.actions.deleting')}
        isPending={deleteWarehouse.isPending}
        onDelete={handleDelete}
        onCancel={() => setWarehouseToDelete(null)}
      />
    </main>
  )
}

export default WarehousesPage
