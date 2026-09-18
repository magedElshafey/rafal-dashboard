import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPinned, Plus } from 'lucide-react'
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
import { RegionDrawer } from '@/modules/regions/components/RegionDrawer'
import { RegionsList } from '@/modules/regions/components/RegionsList'
import { RegionsListSkeleton } from '@/modules/regions/components/RegionsListSkeleton'
import { useDeleteRegion } from '@/modules/regions/hooks/useDeleteRegion'
import { useRegions } from '@/modules/regions/hooks/useRegions'
import type { Region } from '@/modules/regions/types/region.types'
import { getLocalizedRegionName } from '@/modules/regions/utils/region.utils'

function RegionsPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const query = useRegions()
  const deleteRegion = useDeleteRegion()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null)
  const regions = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const editRegion = drawer.mode === 'edit' ? (regions.find((region) => region.id === drawer.entityId) ?? null) : null
  const total = query.data?.pages.at(-1)?.paginate.total ?? regions.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })

  useEffect(() => {
    if (regionToDelete) alertRef.current?.handleOpen(true)
  }, [regionToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('regions.createRegion')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('regions.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('regions.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<RegionsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!regionToDelete || deleteRegion.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteRegion.mutateAsync(regionToDelete.id)
      alertRef.current?.close()
      setRegionToDelete(null)
    } catch {
      // Localized mutation feedback is owned by the hook; keep the dialog open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }

  const deleteName = regionToDelete ? getLocalizedRegionName(regionToDelete.name, i18n.language) : ''
  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('regions.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={regions.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={regions} isLoading={query.isLoading} refetch={query.refetch} name="regions">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={regions.length === 0}
            empty={
              <EmptyState
                icon={<MapPinned />}
                title={t('regions.empty.title')}
                description={t('regions.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <RegionsList
              regions={regions}
              onEdit={(region) => drawer.openEdit(region.id)}
              onDelete={setRegionToDelete}
              actionsDisabled={deleteRegion.isPending}
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
                  <span className="sr-only">{t('regions.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <RegionDrawer open={drawer.open} mode={drawer.mode} region={editRegion} onOpenChange={drawer.setOpen} />
      <DeleteAlert
        ref={alertRef}
        title={t('regions.delete.title')}
        body={t('regions.delete.description', { name: deleteName })}
        confirmLabel={t('regions.actions.delete')}
        cancelLabel={t('regions.actions.cancel')}
        pendingLabel={t('regions.actions.deleting')}
        isPending={deleteRegion.isPending}
        onDelete={handleDelete}
        onCancel={() => setRegionToDelete(null)}
      />
    </main>
  )
}

export default RegionsPage
