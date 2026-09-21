import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
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
import { ShippingMethodDrawer } from '@/modules/shipping-methods/components/ShippingMethodDrawer'
import { ShippingMethodsList } from '@/modules/shipping-methods/components/ShippingMethodsList'
import { ShippingMethodsListSkeleton } from '@/modules/shipping-methods/components/ShippingMethodsListSkeleton'
import { useDeleteShippingMethod } from '@/modules/shipping-methods/hooks/useDeleteShippingMethod'
import { useShippingMethods } from '@/modules/shipping-methods/hooks/useShippingMethods'
import type { ShippingMethod } from '@/modules/shipping-methods/types/shipping-method.types'
import { getLocalizedShippingMethodValue } from '@/modules/shipping-methods/utils/shipping-method.utils'

function ShippingMethodsPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const query = useShippingMethods()
  const deleteShippingMethod = useDeleteShippingMethod()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [methodToDelete, setMethodToDelete] = useState<ShippingMethod | null>(null)
  const shippingMethods = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const editShippingMethod =
    drawer.mode === 'edit'
      ? (shippingMethods.find((shippingMethod) => shippingMethod.id === drawer.entityId) ?? null)
      : null
  const total = query.data?.pages.at(-1)?.paginate.total ?? shippingMethods.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })

  useEffect(() => {
    if (methodToDelete) alertRef.current?.handleOpen(true)
  }, [methodToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('shippingMethods.createShippingMethod')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('shippingMethods.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('shippingMethods.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<ShippingMethodsListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!methodToDelete || deleteShippingMethod.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteShippingMethod.mutateAsync(methodToDelete.id)
      alertRef.current?.close()
      setMethodToDelete(null)
    } catch {
      // Localized mutation feedback is owned by the hook; keep the dialog open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  const deleteName = methodToDelete ? getLocalizedShippingMethodValue(methodToDelete.name, i18n.language) : ''

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('shippingMethods.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={shippingMethods.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider
          data={shippingMethods}
          isLoading={query.isLoading}
          refetch={query.refetch}
          name="shipping-methods"
        >
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={shippingMethods.length === 0}
            empty={
              <EmptyState
                icon={<Truck />}
                title={t('shippingMethods.empty.title')}
                description={t('shippingMethods.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <ShippingMethodsList
              shippingMethods={shippingMethods}
              onEdit={(method) => drawer.openEdit(method.id)}
              onDelete={setMethodToDelete}
              actionsDisabled={deleteShippingMethod.isPending}
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
                  <span className="sr-only">{t('shippingMethods.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <ShippingMethodDrawer
        open={drawer.open}
        mode={drawer.mode}
        shippingMethod={editShippingMethod}
        onOpenChange={drawer.setOpen}
      />
      <DeleteAlert
        ref={alertRef}
        title={t('shippingMethods.delete.title')}
        body={t('shippingMethods.delete.description', { name: deleteName })}
        confirmLabel={t('shippingMethods.actions.delete')}
        cancelLabel={t('shippingMethods.actions.cancel')}
        pendingLabel={t('shippingMethods.actions.deleting')}
        isPending={deleteShippingMethod.isPending}
        onDelete={handleDelete}
        onCancel={() => setMethodToDelete(null)}
      />
    </main>
  )
}

export default ShippingMethodsPage
