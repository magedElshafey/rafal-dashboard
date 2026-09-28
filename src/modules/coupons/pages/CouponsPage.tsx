import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, TicketPercent } from 'lucide-react'
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
import { CouponDrawer } from '@/modules/coupons/components/CouponDrawer'
import { CouponsList } from '@/modules/coupons/components/CouponsList'
import { CouponsListSkeleton } from '@/modules/coupons/components/CouponsListSkeleton'
import { useCoupons } from '@/modules/coupons/hooks/useCoupons'
import { useDeleteCoupon } from '@/modules/coupons/hooks/useDeleteCoupon'
import type { Coupon } from '@/modules/coupons/types/coupon.types'
import { getLocalizedCouponValue } from '@/modules/coupons/utils/coupon.utils'

function CouponsPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const query = useCoupons()
  const deleteCoupon = useDeleteCoupon()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const coupons = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? coupons.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })

  useEffect(() => {
    if (couponToDelete) alertRef.current?.handleOpen(true)
  }, [couponToDelete])

  const openCreate = () => {
    setCouponToEdit(null)
    drawer.openCreate()
  }
  const openEdit = (coupon: Coupon) => {
    setCouponToEdit(coupon)
    drawer.openEdit(coupon.id)
  }
  const handleDrawerOpenChange = (open: boolean) => {
    drawer.setOpen(open)
    if (!open) setCouponToEdit(null)
  }
  const createButton = (
    <Button onClick={openCreate}>
      <Plus aria-hidden="true" />
      {t('coupons.createCoupon')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('coupons.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('coupons.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<CouponsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!couponToDelete || deleteCoupon.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteCoupon.mutateAsync(couponToDelete.id)
      alertRef.current?.close()
      setCouponToDelete(null)
    } catch {
      // Localized mutation feedback is owned by the hook; keep the dialog open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  const deleteName = couponToDelete ? getLocalizedCouponValue(couponToDelete.name, i18n.language) : ''

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('coupons.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={coupons.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={coupons} isLoading={query.isLoading} refetch={query.refetch} name="coupons">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={coupons.length === 0}
            empty={
              <EmptyState
                icon={<TicketPercent />}
                title={t('coupons.empty.title')}
                description={t('coupons.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <CouponsList
              coupons={coupons}
              onEdit={openEdit}
              onDelete={setCouponToDelete}
              actionsDisabled={deleteCoupon.isPending}
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
                  <span className="sr-only">{t('coupons.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <CouponDrawer open={drawer.open} mode={drawer.mode} coupon={couponToEdit} onOpenChange={handleDrawerOpenChange} />
      <DeleteAlert
        ref={alertRef}
        title={t('coupons.delete.title')}
        body={t('coupons.delete.description', { name: deleteName })}
        confirmLabel={t('coupons.actions.delete')}
        cancelLabel={t('coupons.actions.cancel')}
        pendingLabel={t('coupons.actions.deleting')}
        isPending={deleteCoupon.isPending}
        onDelete={handleDelete}
        onCancel={() => setCouponToDelete(null)}
      />
    </main>
  )
}

export default CouponsPage
