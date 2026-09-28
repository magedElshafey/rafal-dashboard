import { useMemo } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataLayout,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { CustomerOrdersListSkeleton } from '@/modules/customers/components/CustomerOrdersListSkeleton'
import {
  CustomerOrderStatusBadge,
  CustomerPaymentStatusBadge,
} from '@/modules/customers/components/CustomerStatusBadges'
import { useCustomerOrders } from '@/modules/customers/hooks/useCustomerOrders'
import type { CustomerOrderListItem } from '@/modules/customers/types/customer.types'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  query: ReturnType<typeof useCustomerOrders>
}

function formatOrderTotal(order: CustomerOrderListItem, locale: string): string {
  const intlLocale = locale.startsWith('ar') ? 'ar' : 'en'
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: order.currency,
      currencyDisplay: 'code',
    }).format(order.total)
  } catch {
    return `${new Intl.NumberFormat(intlLocale).format(order.total)} ${order.currency}`.trim()
  }
}

export function CustomerOrdersSection({ query }: Props) {
  const { t, i18n } = useTranslation()
  const orders = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? orders.length
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en'),
    [i18n.language]
  )
  const locale = resolveAppLocale(i18n.language)
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })
  const header = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('customers.orders.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('customers.orders.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout
      header={header}
      isEmpty={false}
      empty={null}
      isLoading
      loading={<CustomerOrdersListSkeleton />}
    >
      {null}
    </ResponsiveDataLayout>
  )
  const columns = [
    { id: 'number', header: t('customers.orders.fields.number') },
    { id: 'status', header: t('customers.orders.fields.status') },
    { id: 'items', header: t('customers.orders.fields.items'), className: 'w-20' },
    { id: 'total', header: t('customers.orders.fields.total'), className: 'w-32' },
    { id: 'payment', header: t('customers.orders.fields.payment'), className: 'w-28' },
    { id: 'placed', header: t('customers.orders.fields.placedAt'), className: 'w-40' },
  ]
  const placedAt = (order: CustomerOrderListItem) =>
    order.placedAt ? formatDateTime(order.placedAt, { locale }) || '—' : '—'
  const gift = (order: CustomerOrderListItem) =>
    order.isGift ? <Badge variant="secondary">{t('customers.orders.gift')}</Badge> : null

  return (
    <QueryStateBoundary
      loadingFallback={loading}
      isLoading={query.isLoading}
      isLoadingError={query.isError && !query.data}
      isRefetchError={query.isRefetchError}
      isPaused={query.isPaused}
      isFetching={query.isFetching}
      hasData={orders.length > 0}
      onRetry={query.refetch}
    >
      <TableProvider data={orders} isLoading={query.isLoading} refetch={query.refetch} name="customer-orders">
        <ResponsiveDataLayout
          header={header}
          isEmpty={orders.length === 0}
          empty={
            <EmptyState
              variant="compact"
              icon={<ShoppingBag />}
              title={t('customers.orders.empty.title')}
              description={t('customers.orders.empty.description')}
            />
          }
        >
          <ResponsiveDataDesktop>
            <ResponsiveDataTable columns={columns}>
              {orders.map((order) => (
                <ResponsiveDataTableRow key={order.id}>
                  <ResponsiveDataTableCell className="font-medium">
                    <span>{order.displayNumber || order.orderNumber}</span>
                    <span className="ms-2">{gift(order)}</span>
                  </ResponsiveDataTableCell>
                  <ResponsiveDataTableCell>
                    <CustomerOrderStatusBadge status={order.status} />
                  </ResponsiveDataTableCell>
                  <ResponsiveDataTableCell>{numberFormatter.format(order.itemsCount)}</ResponsiveDataTableCell>
                  <ResponsiveDataTableCell>{formatOrderTotal(order, i18n.language)}</ResponsiveDataTableCell>
                  <ResponsiveDataTableCell>
                    <CustomerPaymentStatusBadge status={order.paymentStatus} />
                  </ResponsiveDataTableCell>
                  <ResponsiveDataTableCell>{placedAt(order)}</ResponsiveDataTableCell>
                </ResponsiveDataTableRow>
              ))}
            </ResponsiveDataTable>
          </ResponsiveDataDesktop>
          <ResponsiveDataMobileCards>
            {orders.map((order) => (
              <ResponsiveDataMobileCard
                key={order.id}
                title={order.displayNumber || order.orderNumber}
                actions={gift(order)}
                facts={
                  <>
                    <ResponsiveDataFact label={t('customers.orders.fields.status')}>
                      <CustomerOrderStatusBadge status={order.status} />
                    </ResponsiveDataFact>
                    <ResponsiveDataFact label={t('customers.orders.fields.items')}>
                      {numberFormatter.format(order.itemsCount)}
                    </ResponsiveDataFact>
                    <ResponsiveDataFact label={t('customers.orders.fields.total')}>
                      {formatOrderTotal(order, i18n.language)}
                    </ResponsiveDataFact>
                    <ResponsiveDataFact label={t('customers.orders.fields.payment')}>
                      <CustomerPaymentStatusBadge status={order.paymentStatus} />
                    </ResponsiveDataFact>
                    <ResponsiveDataFact label={t('customers.orders.fields.placedAt')}>
                      {placedAt(order)}
                    </ResponsiveDataFact>
                  </>
                }
              />
            ))}
          </ResponsiveDataMobileCards>
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
                <span className="sr-only">{t('customers.orders.loadingMore')}</span>
                <Skeleton aria-hidden="true" className="h-8 w-40" />
              </>
            ) : null}
          </div>
        </ResponsiveDataLayout>
      </TableProvider>
    </QueryStateBoundary>
  )
}
