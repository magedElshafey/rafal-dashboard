import { useMemo } from 'react'
import { Package, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { ProductsList } from '@/modules/products/components/ProductsList'
import { ProductsListSkeleton } from '@/modules/products/components/ProductsListSkeleton'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { Routes } from '@/routes/routes'

function ProductsPage() {
  const { t } = useTranslation()
  const query = useProducts()
  const products = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? products.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })
  const listHeader = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('products.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('products.total', { count: total })}</p>
    </div>
  )
  const createAction = (
    <Button asChild>
      <Link to={Routes.productNew}>
        <Plus aria-hidden="true" />
        {t('products.actions.create')}
      </Link>
    </Button>
  )
  const loading = (
    <ResponsiveDataLayout header={listHeader} isEmpty={false} empty={null} isLoading loading={<ProductsListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('products.title')} actions={createAction} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={products.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={products} isLoading={query.isLoading} refetch={query.refetch} name="products">
          <ResponsiveDataLayout
            header={listHeader}
            isEmpty={products.length === 0}
            empty={
              <EmptyState
                icon={<Package />}
                title={t('products.empty.title')}
                description={t('products.empty.description')}
                primaryAction={createAction}
              />
            }
          >
            <ProductsList products={products} />
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
                  <span className="sr-only">{t('products.loadingMore')}</span>
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

export default ProductsPage
