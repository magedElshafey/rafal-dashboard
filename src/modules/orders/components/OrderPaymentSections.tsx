import { useTranslation } from 'react-i18next'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { OrderDetail } from '../types/order.types'
import { humanizeOrderValue } from '../utils/order-presentation'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderPaymentSections({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const payment = order?.payment
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <OrderDetailsSection title={t('orders.payment')}>
        <OrderDetailsFacts
          loading={!order}
          facts={[
            [
              t('orders.method'),
              payment?.method === 'card'
                ? t('orders.values.card')
                : payment?.method.trim()
                  ? humanizeOrderValue(payment.method)
                  : '—',
            ],
            [t('orders.fields.paymentStatus'), payment ? <OrderStatusBadge payment value={payment.status} /> : '—'],
            [t('orders.reference'), payment?.reference?.trim() || '—'],
            [t('orders.paidAt'), formatDateTime(payment?.paidAt, { locale: resolveAppLocale(i18n.language) }) || '—'],
          ]}
        />
      </OrderDetailsSection>
      <OrderDetailsSection title={t('orders.fields.warehouse')}>
        <OrderDetailsFacts
          loading={!order}
          facts={[
            [t('orders.name'), order?.warehouse?.name.trim() || '—'],
            [t('orders.id'), order?.warehouse?.id ?? '—'],
          ]}
        />
      </OrderDetailsSection>
    </div>
  )
}
