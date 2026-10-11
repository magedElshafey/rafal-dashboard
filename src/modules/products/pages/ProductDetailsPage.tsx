import { isAxiosError } from 'axios'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import {
  ProductDetailsHeader,
  ProductDetailsLayout,
  ProductDetailsSkeleton,
} from '@/modules/products/components/ProductDetailsLayout'
import { useProduct } from '@/modules/products/hooks/useProduct'

export default function ProductDetailsPage() {
  const { id: routeId } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const parsedId = Number(routeId)
  const id = /^\d+$/.test(routeId ?? '') && Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null
  const query = useProduct(id)
  const notFound = id === null || (!query.data && isAxiosError(query.error) && query.error.response?.status === 404)

  if (notFound)
    return (
      <main className="min-w-0">
        <ProductDetailsHeader />
        <EmptyState
          icon={<Package />}
          title={t('products.details.notFound.title')}
          description={t('products.details.notFound.description')}
        />
      </main>
    )

  const initialFailure = !query.data && (query.isError || query.isPaused)
  return (
    <main className="min-w-0">
      {initialFailure ? <ProductDetailsHeader /> : null}
      <QueryStateBoundary
        loadingFallback={<ProductDetailsSkeleton />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? <ProductDetailsLayout product={query.data} /> : null}
      </QueryStateBoundary>
    </main>
  )
}
