import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { OrderDetail } from '../types/order.types'
import { customerLabel, humanizeOrderValue } from '../utils/order-presentation'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'

export function OrderPartySections({ order }: { order?: OrderDetail }) {
  const { t } = useTranslation()
  const customer = order?.customer
  const address = order?.shippingAddress
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <OrderDetailsSection title={t('orders.fields.customer')}>
        <OrderDetailsFacts
          loading={!order}
          facts={[
            [t('orders.name'), customer ? customerLabel(customer, '—') : '—'],
            [
              t('orders.type'),
              customer ? (
                <Badge variant="outline">
                  {['guest', 'registered'].includes(customer.type)
                    ? t(`orders.values.${customer.type}`)
                    : humanizeOrderValue(customer.type)}
                </Badge>
              ) : (
                '—'
              ),
            ],
            [t('orders.email'), customer?.email.trim() || '—'],
            [t('orders.phone'), customer?.phone.trim() || '—'],
          ]}
        />
      </OrderDetailsSection>
      <OrderDetailsSection title={t('orders.shippingAddress')}>
        <address className="not-italic">
          <OrderDetailsFacts
            loading={!order}
            facts={[
              [t('orders.recipientName'), address?.recipientName.trim() || '—'],
              [t('orders.phone'), address?.recipientPhone.trim() || '—'],
              [t('orders.city'), address?.city?.name.trim() || '—'],
              [t('orders.district'), address?.district.trim() || '—'],
              [t('orders.street'), address?.streetDetails.trim() || '—'],
            ]}
          />
        </address>
      </OrderDetailsSection>
    </div>
  )
}
