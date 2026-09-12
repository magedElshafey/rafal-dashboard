import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageIcon, Plus } from 'lucide-react'
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
import { BannerDrawer } from '@/modules/banners/components/BannerDrawer'
import { BannersList } from '@/modules/banners/components/BannersList'
import { BannersListSkeleton } from '@/modules/banners/components/BannersListSkeleton'
import { useBanners } from '@/modules/banners/hooks/useBanners'
import { useDeleteBanner } from '@/modules/banners/hooks/useDeleteBanner'
import type { Banner } from '@/modules/banners/types/banner.types'

function BannersPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const bannersQuery = useBanners()
  const deleteBanner = useDeleteBanner()
  const deleteAlertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null)
  const banners = useMemo(() => bannersQuery.data?.pages.flatMap((page) => page.items) ?? [], [bannersQuery.data])
  const total = bannersQuery.data?.pages.at(-1)?.paginate.total ?? banners.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(bannersQuery.hasNextPage && !bannersQuery.isFetchingNextPage),
    onLoadMore: bannersQuery.fetchNextPage,
    operationKey: bannersQuery.data?.pages.length,
  })

  useEffect(() => {
    if (bannerToDelete) deleteAlertRef.current?.handleOpen(true)
  }, [bannerToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('banners.createBanner')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('banners.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('banners.total', { count: total })}</p>
    </div>
  )
  const loadingSurface = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<BannersListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!bannerToDelete || deleteBanner.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteBanner.mutateAsync(bannerToDelete.id)
      deleteAlertRef.current?.close()
      setBannerToDelete(null)
    } catch {
      // Mutation feedback is localized by the hook; keep the alert open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }
  const deleteTitle = bannerToDelete?.title[i18n.language.startsWith('ar') ? 'ar' : 'en'] ?? ''

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('banners.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loadingSurface}
        isLoading={bannersQuery.isLoading}
        isLoadingError={bannersQuery.isError && !bannersQuery.data}
        isRefetchError={bannersQuery.isRefetchError}
        isPaused={bannersQuery.isPaused}
        isFetching={bannersQuery.isFetching}
        hasData={banners.length > 0}
        onRetry={bannersQuery.refetch}
      >
        <TableProvider data={banners} isLoading={bannersQuery.isLoading} refetch={bannersQuery.refetch} name="banners">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={banners.length === 0}
            empty={
              <EmptyState
                icon={<ImageIcon />}
                title={t('banners.empty.title')}
                description={t('banners.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <BannersList
              banners={banners}
              onEdit={(banner) => drawer.openEdit(banner.id)}
              onDelete={setBannerToDelete}
              actionsDisabled={deleteBanner.isPending}
            />
            {bannersQuery.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={bannersQuery.isFetchingNextPage}
                  onRetry={() => void bannersQuery.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {bannersQuery.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('banners.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <BannerDrawer open={drawer.open} mode={drawer.mode} bannerId={drawer.entityId} onOpenChange={drawer.setOpen} />
      <DeleteAlert
        ref={deleteAlertRef}
        title={t('banners.delete.title')}
        body={t('banners.delete.description', { title: deleteTitle })}
        confirmLabel={t('banners.actions.delete')}
        cancelLabel={t('banners.actions.cancel')}
        pendingLabel={t('banners.actions.deleting')}
        isPending={deleteBanner.isPending}
        onDelete={handleDelete}
        onCancel={() => setBannerToDelete(null)}
      />
    </main>
  )
}

export default BannersPage
