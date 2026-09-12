import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, UsersRound } from 'lucide-react'
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
import { AdminDrawer } from '@/modules/admins/components/AdminDrawer'
import { AdminsList } from '@/modules/admins/components/AdminsList'
import { AdminsListSkeleton } from '@/modules/admins/components/AdminsListSkeleton'
import { useAdmins } from '@/modules/admins/hooks/useAdmins'
import { useDeleteAdmin } from '@/modules/admins/hooks/useDeleteAdmin'
import type { Admin } from '@/modules/admins/types/admin.types'

function AdminsPage() {
  const { t } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const adminsQuery = useAdmins()
  const deleteAdmin = useDeleteAdmin()
  const deleteAlertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)
  const admins = useMemo(() => adminsQuery.data?.pages.flatMap((page) => page.items) ?? [], [adminsQuery.data])
  const lastPage = adminsQuery.data?.pages.at(-1)
  const total = lastPage?.paginate.total ?? admins.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(adminsQuery.hasNextPage && !adminsQuery.isFetchingNextPage),
    onLoadMore: adminsQuery.fetchNextPage,
    operationKey: adminsQuery.data?.pages.length,
  })

  useEffect(() => {
    if (adminToDelete) deleteAlertRef.current?.handleOpen(true)
  }, [adminToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('admins.createAdmin')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('admins.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('admins.total', { count: total })}</p>
    </div>
  )
  const loadingSurface = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<AdminsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!adminToDelete || deleteAdmin.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteAdmin.mutateAsync(adminToDelete.id)
      deleteAlertRef.current?.close()
      setAdminToDelete(null)
    } catch {
      // The feature mutation owns localized feedback; keep the confirmation open for retry or cancel.
    } finally {
      deleteLockRef.current = false
    }
  }

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('admins.title')} actions={createButton} />

      <QueryStateBoundary
        loadingFallback={loadingSurface}
        isLoading={adminsQuery.isLoading}
        isLoadingError={adminsQuery.isError && !adminsQuery.data}
        isRefetchError={adminsQuery.isRefetchError}
        isPaused={adminsQuery.isPaused}
        isFetching={adminsQuery.isFetching}
        hasData={admins.length > 0}
        onRetry={adminsQuery.refetch}
      >
        <TableProvider data={admins} isLoading={adminsQuery.isLoading} refetch={adminsQuery.refetch} name="admins">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={admins.length === 0}
            empty={
              <EmptyState
                icon={<UsersRound />}
                title={t('admins.empty.title')}
                description={t('admins.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <AdminsList
              admins={admins}
              onEdit={(admin) => drawer.openEdit(admin.id)}
              onDelete={setAdminToDelete}
              actionsDisabled={deleteAdmin.isPending}
            />
            {adminsQuery.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={adminsQuery.isFetchingNextPage}
                  onRetry={() => void adminsQuery.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {adminsQuery.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('admins.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <AdminDrawer open={drawer.open} mode={drawer.mode} adminId={drawer.entityId} onOpenChange={drawer.setOpen} />

      <DeleteAlert
        ref={deleteAlertRef}
        title={t('admins.delete.title')}
        body={t('admins.delete.description', { name: adminToDelete?.name ?? '' })}
        confirmLabel={t('admins.actions.delete')}
        cancelLabel={t('admins.actions.cancel')}
        pendingLabel={t('admins.actions.deleting')}
        isPending={deleteAdmin.isPending}
        onDelete={handleDelete}
        onCancel={() => setAdminToDelete(null)}
      />
    </main>
  )
}

export default AdminsPage
