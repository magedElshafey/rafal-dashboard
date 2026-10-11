import { useTranslation } from 'react-i18next'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { OrderDetail } from '../types/order.types'
import { OrderDetailsHeader } from './OrderDetailsHeader'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'
import { OrderPartySections } from './OrderPartySections'
import { OrderItems } from './OrderItems'
import { OrderMoneySummary } from './OrderMoneySummary'
import { OrderPaymentSections } from './OrderPaymentSections'
import { OrderGiftSection } from './OrderGiftSection'
import { OrderStatusHistory } from './OrderStatusHistory'

/** Share all major page geometry between loaded data and primitive placeholders. */
export function OrderDetailsLayout({ order, refreshing = false }: { order?: OrderDetail; refreshing?: boolean }) {
  const { t, i18n } = useTranslation()
  const date = (value: string | null | undefined) =>
    formatDateTime(value, { locale: resolveAppLocale(i18n.language) }) || '—'
  return (
    <>
      <OrderDetailsHeader order={order} loading={!order} refreshing={refreshing} />
      <div className="space-y-5">
        <OrderPartySections order={order} />
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <OrderDetailsSection title={t('orders.fields.items')}>
            <OrderItems items={order?.items} currency={order?.money.currency} />
          </OrderDetailsSection>
          <OrderMoneySummary order={order} />
        </div>
        <OrderPaymentSections order={order} />
        <OrderGiftSection order={order} />
        <OrderStatusHistory order={order} />
        <OrderDetailsSection title={t('orders.details.metadata')}>
          <OrderDetailsFacts
            loading={!order}
            facts={[
              [t('orders.id'), order?.id],
              [t('orders.fields.placedAt'), date(order?.placedAt)],
              [t('orders.createdAt'), date(order?.createdAt)],
              [t('orders.updatedAt'), date(order?.updatedAt)],
              [t('orders.cancelledAt'), date(order?.cancelledAt)],
            ]}
          />
        </OrderDetailsSection>
      </div>
    </>
  )
}
