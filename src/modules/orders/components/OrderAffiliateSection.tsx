import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Routes } from '@/routes/routes'
import { useAffiliateAccess } from '@/modules/affiliates/config/affiliate-access'
import type { OrderDetail } from '../types/order.types'
import { orderMoneyLabel } from '../utils/order-presentation'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'

export function OrderAffiliateSection({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const canView = useAffiliateAccess('view')
  const affiliate = order?.affiliate
  if (!affiliate || !order) return null
  const money = (value: string) => <bdi>{orderMoneyLabel(value, order.money.currency, i18n.language)}</bdi>
  return (
    <OrderDetailsSection title={t('orders.affiliate.title')}>
      <OrderDetailsFacts
        facts={[
          [
            t('orders.affiliate.name'),
            canView ? (
              <Link className="underline focus-visible:outline-ring" to={Routes.affiliateDetailPath(affiliate.id)}>
                <bdi>{affiliate.name}</bdi>
              </Link>
            ) : (
              <bdi>{affiliate.name}</bdi>
            ),
          ],
          [t('orders.affiliate.code'), <bdi>{affiliate.code}</bdi>],
          [t('orders.affiliate.discountPercent'), <bdi>{affiliate.discount.percent}%</bdi>],
          [t('orders.affiliate.discount'), money(affiliate.discount.amount)],
          [t('orders.affiliate.base'), money(affiliate.commission.base)],
          [t('orders.affiliate.rate'), <bdi>{affiliate.commission.rate}%</bdi>],
          [t('orders.affiliate.amount'), money(affiliate.commission.amount)],
          [
            t('orders.affiliate.status'),
            ['pending', 'approved', 'cancelled'].includes(affiliate.commission.status) ? (
              t(`orders.affiliate.${affiliate.commission.status}`)
            ) : (
              <bdi>{affiliate.commission.status}</bdi>
            ),
          ],
          [t('orders.affiliate.adjustment'), money(affiliate.commission.adjustment_amount)],
        ]}
      />
    </OrderDetailsSection>
  )
}
