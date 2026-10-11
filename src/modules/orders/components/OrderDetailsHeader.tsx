import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { OrderDetail } from '../types/order.types'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderStatusAction } from './OrderStatusAction'

export function OrderDetailsHeader({
  order,
  loading = false,
  refreshing = false,
}: {
  order?: OrderDetail
  loading?: boolean
  refreshing?: boolean
}) {
  const { t, i18n } = useTranslation()
  const title = order?.displayNumber.trim() || order?.orderNumber.trim() || t('orders.details.title')
  const date = formatDateTime(order?.placedAt, { locale: resolveAppLocale(i18n.language) })
  return (
    <div className="relative">
      <DashboardPageHeader
        title={<bdi className={`block min-h-9 [overflow-wrap:anywhere] ${loading ? 'invisible' : ''}`}>{title}</bdi>}
        description={
          order ? (
            <span className="inline-flex min-h-6 flex-wrap items-center gap-3">
              <OrderStatusBadge value={order.status} />
              {date ? (
                <span>
                  {t('orders.fields.placedAt')}: <time dateTime={order.placedAt ?? undefined}>{date}</time>
                </span>
              ) : null}
            </span>
          ) : loading ? (
            <span className="inline-block h-6" />
          ) : undefined
        }
        actions={
          loading ? (
            <>
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-32" />
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to={Routes.orders}>
                  <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
                  {t('orders.back')}
                </Link>
              </Button>
              {order ? <OrderStatusAction key={order.id} order={order} refreshing={refreshing} /> : null}
            </>
          )
        }
      />
      {/* The primitive renders a div, so keep it outside the header's h1/p phrasing content. */}
      {loading ? (
        <>
          <Skeleton className="pointer-events-none absolute start-0 top-0 h-9 w-60 max-w-full" />
          <Skeleton className="pointer-events-none absolute start-0 top-10 h-6 w-48 max-w-full" />
        </>
      ) : null}
    </div>
  )
}
