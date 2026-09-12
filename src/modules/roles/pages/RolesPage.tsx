import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { useEntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { RoleDrawer } from '@/modules/roles/components/RoleDrawer'
import { RolesList } from '@/modules/roles/components/RolesList'
import { RolesListSkeleton } from '@/modules/roles/components/RolesListSkeleton'
import { useDeleteRole } from '@/modules/roles/hooks/useDeleteRole'
import { useRoles } from '@/modules/roles/hooks/useRoles'
import type { Role } from '@/modules/roles/types/role.types'

function RolesPage() {
  const { t } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const rolesQuery = useRoles()
  const deleteRole = useDeleteRole()
  const deleteAlertRef = useRef<DeleteAlertRef>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const roles = useMemo(() => rolesQuery.data?.pages.flatMap((page) => page.items) ?? [], [rolesQuery.data])
  const lastPage = rolesQuery.data?.pages.at(-1)
  const total = lastPage?.paginate.total ?? roles.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(rolesQuery.hasNextPage && !rolesQuery.isFetchingNextPage),
    onLoadMore: rolesQuery.fetchNextPage,
    operationKey: rolesQuery.data?.pages.length,
  })

  useEffect(() => {
    if (roleToDelete) deleteAlertRef.current?.handleOpen(true)
  }, [roleToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('roles.createRole')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('roles.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('roles.total', { count: total })}</p>
    </div>
  )
  const loadingSurface = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<RolesListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!roleToDelete || deleteRole.isPending) return
    try {
      await deleteRole.mutateAsync(roleToDelete.id)
      deleteAlertRef.current?.close()
      setRoleToDelete(null)
    } catch {
      // The feature mutation owns localized error feedback; keep confirmation open for retry/cancel.
    }
  }

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('roles.title')} actions={createButton} />

      <QueryStateBoundary
        loadingFallback={loadingSurface}
        isLoading={rolesQuery.isLoading}
        isLoadingError={rolesQuery.isError && !rolesQuery.data}
        isRefetchError={rolesQuery.isRefetchError}
        isPaused={rolesQuery.isPaused}
        isFetching={rolesQuery.isFetching}
        hasData={roles.length > 0}
        onRetry={rolesQuery.refetch}
      >
        <TableProvider data={roles} isLoading={rolesQuery.isLoading} refetch={rolesQuery.refetch} name="roles">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={roles.length === 0}
            empty={
              <EmptyState
                icon={<ShieldCheck />}
                title={t('roles.empty.title')}
                description={t('roles.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <RolesList
              roles={roles}
              onEdit={(role) => drawer.openEdit(role.id)}
              onDelete={setRoleToDelete}
              actionsDisabled={deleteRole.isPending}
            />
            {rolesQuery.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={rolesQuery.isFetchingNextPage}
                  onRetry={() => void rolesQuery.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {rolesQuery.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('roles.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <RoleDrawer open={drawer.open} mode={drawer.mode} roleId={drawer.entityId} onOpenChange={drawer.setOpen} />

      <DeleteAlert
        ref={deleteAlertRef}
        title={t('roles.delete.title')}
        body={t('roles.delete.description', { name: roleToDelete?.name ?? '' })}
        confirmLabel={t('roles.actions.delete')}
        cancelLabel={t('roles.actions.cancel')}
        pendingLabel={t('roles.actions.deleting')}
        isPending={deleteRole.isPending}
        onDelete={handleDelete}
        onCancel={() => setRoleToDelete(null)}
      />
    </main>
  )
}

export default RolesPage
