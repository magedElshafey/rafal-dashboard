import { useMemo } from 'react'
import { Plus, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import FiltersWrapper from '@/components/filters/FiltersWrapper'
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
import { AffiliateCreateDrawer } from '@/modules/affiliates/components/AffiliateCreateDrawer'
import { AffiliateFilters } from '@/modules/affiliates/components/AffiliateFilters'
import { AffiliatesList } from '@/modules/affiliates/components/AffiliatesList'
import { AffiliatesListSkeleton } from '@/modules/affiliates/components/AffiliatesListSkeleton'
import { useAffiliates } from '@/modules/affiliates/hooks/useAffiliates'
import { affiliateFilterNames, readAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'
import QueryProvider from '@/store/queryContext/queryContext'
import { useQuery } from '@/store/queryContext/useQueryContext'

function AffiliatesContent() {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const drawer = useEntityFormDrawer()
  const filters = readAffiliateFilters(forwardQuery)
  const query = useAffiliates(filters)
  const affiliates = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? affiliates.length
  const hasFilters = Boolean(filters.search || filters.status)
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: JSON.stringify([filters, query.data?.pages.length]),
  })

  const createButton = (
    <Button onClick={drawer.openCreate}>
      <Plus aria-hidden="true" />
      {t('affiliates.actions.create')}
    </Button>
  )
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('affiliates.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('affiliates.total', { count: total })}</p>
    </div>
  )
  const loadingSurface = (
    <ResponsiveDataLayout
      header={listHeader}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<AffiliatesListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )

  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader
        title={t('affiliates.title')}
        description={t('affiliates.description')}
        actions={createButton}
      />
      <FiltersWrapper
        searchName="search"
        filterNames={affiliateFilterNames}
        resetQueryNamesOnChange={['page']}
        searchLabel={t('affiliates.filters.search')}
        searchPlaceholder={t('affiliates.filters.searchPlaceholder')}
        dialogTitle={t('affiliates.filters.title')}
      >
        <AffiliateFilters />
      </FiltersWrapper>

      <QueryStateBoundary
        loadingFallback={loadingSurface}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError && !query.isFetchNextPageError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        <TableProvider data={affiliates} isLoading={query.isLoading} refetch={query.refetch} name="affiliates">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={affiliates.length === 0}
            empty={
              <EmptyState
                icon={<UsersRound />}
                title={t(hasFilters ? 'affiliates.empty.filteredTitle' : 'affiliates.empty.title')}
                description={t(hasFilters ? 'affiliates.empty.filteredDescription' : 'affiliates.empty.description')}
                primaryAction={hasFilters ? undefined : createButton}
              />
            }
          >
            <AffiliatesList affiliates={affiliates} />
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
                  <span className="sr-only">{t('affiliates.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>

      <AffiliateCreateDrawer open={drawer.open} onOpenChange={drawer.setOpen} />
    </main>
  )
}

export default function AffiliatesPage() {
  return (
    <QueryProvider resetQueryNamesOnChange={['page']}>
      <AffiliatesContent />
    </QueryProvider>
  )
}
