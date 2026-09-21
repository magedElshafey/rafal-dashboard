import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
import { CityDrawer } from '@/modules/cities/components/CityDrawer'
import { CitiesList } from '@/modules/cities/components/CitiesList'
import { CitiesListSkeleton } from '@/modules/cities/components/CitiesListSkeleton'
import { useCities } from '@/modules/cities/hooks/useCities'
import { useDeleteCity } from '@/modules/cities/hooks/useDeleteCity'
import type { City } from '@/modules/cities/types/city.types'
import { getLocalizedName } from '@/modules/cities/utils/city.utils'

function CitiesPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const deleteCity = useDeleteCity()
  const alertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [cityToDelete, setCityToDelete] = useState<City | null>(null)
  const query = useCities()
  const cities = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const editCity = drawer.mode === 'edit' ? (cities.find((city) => city.id === drawer.entityId) ?? null) : null
  const total = query.data?.pages.at(-1)?.paginate.total ?? cities.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })

  useEffect(() => {
    if (cityToDelete) alertRef.current?.handleOpen(true)
  }, [cityToDelete])

  const handleDelete = async () => {
    if (!cityToDelete || deleteCity.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteCity.mutateAsync(cityToDelete.id)
      alertRef.current?.close()
      setCityToDelete(null)
    } catch {
      // Localized mutation feedback is owned by the hook; keep the dialog open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }
  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('cities.createCity')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('cities.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('cities.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<CitiesListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('cities.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={cities.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={cities} isLoading={query.isLoading} refetch={query.refetch} name="cities">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={cities.length === 0}
            empty={
              <EmptyState
                icon={<Building2 />}
                title={t('cities.empty.title')}
                description={t('cities.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <CitiesList
              cities={cities}
              onEdit={(city) => drawer.openEdit(city.id)}
              onDelete={setCityToDelete}
              actionsDisabled={deleteCity.isPending}
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
                  <span className="sr-only">{t('cities.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <CityDrawer open={drawer.open} mode={drawer.mode} city={editCity} onOpenChange={drawer.setOpen} />
      <DeleteAlert
        ref={alertRef}
        title={t('cities.delete.title')}
        body={t('cities.delete.description', {
          name: cityToDelete ? getLocalizedName(cityToDelete.name, i18n.language) : '',
        })}
        confirmLabel={t('cities.actions.delete')}
        cancelLabel={t('cities.actions.cancel')}
        pendingLabel={t('cities.actions.deleting')}
        isPending={deleteCity.isPending}
        onDelete={handleDelete}
        onCancel={() => setCityToDelete(null)}
      />
    </main>
  )
}

export default CitiesPage
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
