import { BlogNavigation } from '@/modules/blogs/components/BlogNavigation'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import FiltersWrapper from '@/components/filters/FiltersWrapper'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { BlogPostFilters } from '@/modules/blogs/components/posts/BlogPostFilters'
import { BlogPostsList } from '@/modules/blogs/components/posts/BlogPostsList'
import { BlogPostCreateDrawer } from '@/modules/blogs/components/posts/BlogPostCreateDrawer'
import { useBlogPosts } from '@/modules/blogs/hooks/posts/useBlogPosts'
import {
  blogPostFilterNames,
  readBlogPostsFilters,
  serializeBlogPostsFilters,
  validBlogPublishedRange,
} from '@/modules/blogs/utils/blog-post-filters'
function Content() {
  const { t } = useTranslation()
  const { forwardQuery, forwardDeleteQuery } = useQuery()
  const filters = readBlogPostsFilters(forwardQuery)
  const valid = validBlogPublishedRange(filters)
  const query = useBlogPosts(filters)
  const [createOpen, setCreateOpen] = useState(false)
  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const filtered = Object.keys(serializeBlogPostsFilters(filters)).length > 0
  const reset = () => forwardDeleteQuery(['search', ...blogPostFilterNames, 'page'])
  const loadMore = useInfiniteScroll({
    enabled: Boolean(valid && query.hasNextPage && !query.isFetching && !query.isError && !query.isPaused),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  const create = <Button onClick={() => setCreateOpen(true)}>{t('blogPosts.create')}</Button>
  const header = (
    <div>
      <h2 className="font-semibold">{t('blogPosts.list')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('blogPosts.total', { count: query.data?.pages[0]?.paginate.total ?? 0 })}
      </p>
    </div>
  )
  const forbidden = isAxiosError(query.error) && query.error.response?.status === 403
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader title={t('blogPosts.title')} actions={create} />
      <BlogNavigation />
      <FiltersWrapper
        searchLabel={t('blogPosts.search')}
        searchPlaceholder={t('blogPosts.search')}
        filterNames={blogPostFilterNames}
        resetQueryNamesOnChange={['page']}
        dialogTitle={t('blogPosts.filters')}
        onApply={(draft) => (validBlogPublishedRange(readBlogPostsFilters(draft)) ? draft : false)}
      >
        <BlogPostFilters />
      </FiltersWrapper>
      {forbidden && <p role="alert">{t('blogCategories.forbidden')}</p>}
      {!valid ? (
        <div role="alert">
          <p>{t('blogPosts.invalidRange')}</p>
          <Button onClick={reset}>{t('blogCategories.reset')}</Button>
        </div>
      ) : (
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
              loading={<BlogPostsList loading />}
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
                title={t(filtered ? 'blogPosts.noResults' : 'blogPosts.empty')}
                primaryAction={filtered ? <Button onClick={reset}>{t('blogCategories.reset')}</Button> : create}
              />
            }
          >
            <BlogPostsList items={items} />
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
                <BlogPostsList loading />
              </div>
            )}
          </ResponsiveDataLayout>
        </QueryStateBoundary>
      )}
      {createOpen && <BlogPostCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />}
    </main>
  )
}
export default function BlogPostsPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <Content />
    </QueryProvider>
  )
}
