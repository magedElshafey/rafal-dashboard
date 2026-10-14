import { BlogNavigation } from '@/modules/blogs/components/BlogNavigation'
import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import FiltersWrapper from '@/components/filters/FiltersWrapper'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'
import { BlogCategoryDrawer } from '@/modules/blogs/components/categories/BlogCategoryDrawer'
import { BlogCategoryFilters } from '@/modules/blogs/components/categories/BlogCategoryFilters'
import { BlogCategoriesList } from '@/modules/blogs/components/categories/BlogCategoriesList'
import { useBlogCategories } from '@/modules/blogs/hooks/categories/useBlogCategories'
import { useDeleteBlogCategory } from '@/modules/blogs/hooks/categories/useDeleteBlogCategory'
import {
  blogCategoryFilterNames,
  readBlogCategoriesFilters,
  serializeBlogCategoriesFilters,
} from '@/modules/blogs/utils/blog-category-filters'
import type { BlogCategory } from '@/modules/blogs/types/blog-category.types'
function Content() {
  const { t, i18n } = useTranslation()
  const { forwardQuery, forwardDeleteQuery } = useQuery()
  const filters = readBlogCategoriesFilters(forwardQuery)
  const query = useBlogCategories(filters)
  const [form, setForm] = useState<'create' | BlogCategory | null>(null)
  const mutation = useDeleteBlogCategory()
  const alert = useRef<DeleteAlertRef>(null)
  const lock = useRef(false)
  const [selected, setSelected] = useState<BlogCategory | null>(null)
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const createButton = <Button onClick={() => setForm('create')}>{t('blogCategories.create')}</Button>
  const filtered = Object.keys(serializeBlogCategoriesFilters(filters)).length > 0
  const reset = () => forwardDeleteQuery(['search', ...blogCategoryFilterNames, 'page'])
  const loadMore = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isError && !query.isPaused),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  const header = (
    <div>
      <h2 className="font-semibold">{t('blogCategories.list')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('blogCategories.total', { count: query.data?.pages[0]?.paginate.total ?? 0 })}
      </p>
    </div>
  )
  const remove = async () => {
    if (!selected || lock.current || mutation.isPending) return
    lock.current = true
    try {
      await mutation.mutateAsync(selected.id)
      alert.current?.close()
      setSelected(null)
    } catch {
      /* Keep confirmation open for retry. */
    } finally {
      lock.current = false
    }
  }
  const forbidden = isAxiosError(query.error) && query.error.response?.status === 403
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader title={t('blogCategories.title')} actions={createButton} />
      <BlogNavigation />
      <FiltersWrapper
        searchLabel={t('blogCategories.search')}
        searchPlaceholder={t('blogCategories.search')}
        filterNames={blogCategoryFilterNames}
        resetQueryNamesOnChange={['page']}
        dialogTitle={t('blogCategories.filters')}
      >
        <BlogCategoryFilters />
      </FiltersWrapper>
      {forbidden && <p role="alert">{t('blogCategories.forbidden')}</p>}
      <QueryStateBoundary
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
        loadingFallback={
          <ResponsiveDataLayout
            header={header}
            isEmpty={false}
            empty={null}
            isLoading
            loading={<BlogCategoriesList loading />}
          >
            {null}
          </ResponsiveDataLayout>
        }
      >
        <ResponsiveDataLayout
          header={header}
          isEmpty={items.length === 0}
          empty={
            <EmptyState
              title={t(filtered ? 'blogCategories.noResults' : 'blogCategories.empty')}
              primaryAction={filtered ? <Button onClick={reset}>{t('blogCategories.reset')}</Button> : createButton}
            />
          }
        >
          <BlogCategoriesList
            items={items}
            disabled={mutation.isPending || query.isRefetchError || query.isPaused}
            onEdit={setForm}
            onDelete={(item) => {
              mutation.reset()
              setSelected(item)
              alert.current?.handleOpen(true)
            }}
          />
          {query.isFetchNextPageError && (
            <QueryStateNotice
              kind="refetch-error"
              isRetrying={query.isFetchingNextPage}
              onRetry={() => void query.fetchNextPage()}
            />
          )}
          <div ref={loadMore} className="min-h-1" />
          {query.isFetchingNextPage && (
            <div role="status" aria-busy="true">
              <span className="sr-only">{t('blogCategories.loadingMore')}</span>
              <BlogCategoriesList loading />
            </div>
          )}
        </ResponsiveDataLayout>
      </QueryStateBoundary>
      {form && (
        <BlogCategoryDrawer
          key={form === 'create' ? form : form.id}
          category={form === 'create' ? null : form}
          onClose={() => setForm(null)}
        />
      )}
      <DeleteAlert
        ref={alert}
        title={t('blogCategories.delete')}
        body={
          <>
            <p>
              {t('blogCategories.deleteDescription', {
                name:
                  selected?.name[i18n.language.startsWith('ar') ? 'ar' : 'en'] ||
                  selected?.name.ar ||
                  selected?.slug ||
                  '',
              })}
            </p>
            {mutation.isError && (
              <p role="alert">{getApiErrorMessage(mutation.error, t('blogCategories.deleteError'))}</p>
            )}
          </>
        }
        confirmLabel={t('blogCategories.delete')}
        isPending={mutation.isPending}
        onDelete={remove}
        onCancel={() => setSelected(null)}
      />
    </main>
  )
}
export default function BlogCategoriesPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <Content />
    </QueryProvider>
  )
}
