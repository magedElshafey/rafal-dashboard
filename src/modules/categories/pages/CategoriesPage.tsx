import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderTree, Plus } from 'lucide-react'
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
import { CategoriesList } from '@/modules/categories/components/CategoriesList'
import { CategoriesListSkeleton } from '@/modules/categories/components/CategoriesListSkeleton'
import { CategoryDrawer } from '@/modules/categories/components/CategoryDrawer'
import { useCategories } from '@/modules/categories/hooks/useCategories'
import { useDeleteCategory } from '@/modules/categories/hooks/useDeleteCategory'
import type { Category } from '@/modules/categories/types/category.types'

function CategoriesPage() {
  const { t, i18n } = useTranslation()
  const drawer = useEntityFormDrawer<number>()
  const categoriesQuery = useCategories()
  const deleteCategory = useDeleteCategory()
  const deleteAlertRef = useRef<DeleteAlertRef>(null)
  const deleteLockRef = useRef(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const categories = useMemo(
    () => categoriesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [categoriesQuery.data]
  )
  const total = categoriesQuery.data?.pages.at(-1)?.paginate.total ?? categories.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(categoriesQuery.hasNextPage && !categoriesQuery.isFetchingNextPage),
    onLoadMore: categoriesQuery.fetchNextPage,
    operationKey: categoriesQuery.data?.pages.length,
  })

  useEffect(() => {
    if (categoryToDelete) deleteAlertRef.current?.handleOpen(true)
  }, [categoryToDelete])

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('categories.createCategory')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('categories.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('categories.total', { count: total })}</p>
    </div>
  )
  const loadingSurface = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<CategoriesListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  const handleDelete = async () => {
    if (!categoryToDelete || deleteCategory.isPending || deleteLockRef.current) return
    deleteLockRef.current = true
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id)
      deleteAlertRef.current?.close()
      setCategoryToDelete(null)
    } catch {
      // Mutation feedback is localized by the hook; keep the alert open for retry.
    } finally {
      deleteLockRef.current = false
    }
  }
  const deleteName = categoryToDelete?.name[i18n.language.startsWith('ar') ? 'ar' : 'en'] ?? ''

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('categories.title')} actions={createButton} />
      <QueryStateBoundary
        loadingFallback={loadingSurface}
        isLoading={categoriesQuery.isLoading}
        isLoadingError={categoriesQuery.isError && !categoriesQuery.data}
        isRefetchError={categoriesQuery.isRefetchError}
        isPaused={categoriesQuery.isPaused}
        isFetching={categoriesQuery.isFetching}
        hasData={categories.length > 0}
        onRetry={categoriesQuery.refetch}
      >
        <TableProvider
          data={categories}
          isLoading={categoriesQuery.isLoading}
          refetch={categoriesQuery.refetch}
          name="categories"
        >
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={categories.length === 0}
            empty={
              <EmptyState
                icon={<FolderTree />}
                title={t('categories.empty.title')}
                description={t('categories.empty.description')}
                primaryAction={createButton}
              />
            }
          >
            <CategoriesList
              categories={categories}
              onEdit={(category) => drawer.openEdit(category.id)}
              onDelete={setCategoryToDelete}
              actionsDisabled={deleteCategory.isPending}
            />
            {categoriesQuery.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={categoriesQuery.isFetchingNextPage}
                  onRetry={() => void categoriesQuery.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {categoriesQuery.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('categories.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <CategoryDrawer
        open={drawer.open}
        mode={drawer.mode}
        categoryId={drawer.entityId}
        onOpenChange={drawer.setOpen}
      />
      <DeleteAlert
        ref={deleteAlertRef}
        title={t('categories.delete.title')}
        body={t('categories.delete.description', { name: deleteName })}
        confirmLabel={t('categories.actions.delete')}
        cancelLabel={t('categories.actions.cancel')}
        pendingLabel={t('categories.actions.deleting')}
        isPending={deleteCategory.isPending}
        onDelete={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </main>
  )
}

export default CategoriesPage
