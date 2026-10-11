import { isAxiosError } from 'axios'
import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { OrderDetailsHeader } from '../components/OrderDetailsHeader'
import { OrderDetailsLayout } from '../components/OrderDetailsLayout'
import { useOrder } from '../hooks/useOrders'

function OrderNotFound() {
  const { t } = useTranslation()
  return (
    <main className="min-w-0">
      <OrderDetailsHeader />
      <EmptyState
        icon={<Package />}
        title={t('orders.details.notFound')}
        description={t('orders.details.notFoundDescription')}
      />
    </main>
  )
}

function OrderDetails({ id }: { id: number }) {
  const query = useOrder(id)
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <OrderNotFound />
  return (
    <main className="min-w-0">
      {!query.data && (query.isError || query.isPaused) ? <OrderDetailsHeader /> : null}
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<OrderDetailsLayout />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <OrderDetailsLayout order={query.data} refreshing={query.isFetching || query.isRefetchError} />
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function OrderDetailPage() {
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  if (!Number.isSafeInteger(id)) return <OrderNotFound />
  return <OrderDetails key={id} id={id} />
}
