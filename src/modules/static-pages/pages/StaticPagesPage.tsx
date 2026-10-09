import { useMemo } from 'react'
import { FileText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import FiltersWrapper from '@/components/filters/FiltersWrapper'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { StaticPagesList } from '@/modules/static-pages/components/StaticPagesList'
import { StaticPagesListSkeleton } from '@/modules/static-pages/components/StaticPagesListSkeleton'
import { StaticPageFilters } from '@/modules/static-pages/components/StaticPageFilters'
import { useStaticPages } from '@/modules/static-pages/hooks/useStaticPages'
import { readPagesFilters, staticPageFilterNames } from '@/modules/static-pages/utils/static-page-filters'
import { Routes } from '@/routes/routes'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

function StaticPagesContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { forwardQuery } = useQuery()
  const filters = readPagesFilters(forwardQuery)
  const query = useStaticPages(filters)
  const pages = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? pages.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('staticPages.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('staticPages.total', { count: total })}</p>
    </div>
  )
  const createAction = (
    <Button asChild>
      <Link to={Routes.staticPageNew}>
        <Plus aria-hidden="true" />
        {t('staticPages.actions.createPage')}
      </Link>
    </Button>
  )
  const loading = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<StaticPagesListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader
        title={t('staticPages.title')}
        description={t('staticPages.description')}
        actions={createAction}
      />
      <FiltersWrapper
        filterNames={staticPageFilterNames}
        resetQueryNamesOnChange={['page']}
        searchLabel={t('staticPages.filters.search')}
        searchPlaceholder={t('staticPages.filters.search')}
        dialogTitle={t('staticPages.filters.title')}
      >
        <StaticPageFilters />
      </FiltersWrapper>
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={pages.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={pages} isLoading={query.isLoading} refetch={query.refetch} name="static-pages">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={pages.length === 0}
            empty={
              <EmptyState
                icon={<FileText />}
                title={t('staticPages.empty.title')}
                description={t('staticPages.empty.description')}
                primaryAction={createAction}
              />
            }
          >
            <StaticPagesList pages={pages} onEdit={(page) => navigate(Routes.staticPageEditPath(page.id))} />
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
                  <span className="sr-only">{t('staticPages.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
    </main>
  )
}

export default function StaticPagesPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <StaticPagesContent />
    </QueryProvider>
  )
}
