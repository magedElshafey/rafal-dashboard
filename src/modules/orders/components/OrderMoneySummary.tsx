import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import type { OrderDetail } from '../types/order.types'
import { orderMoneyLabel } from '../utils/order-presentation'
import { OrderDetailsSection } from './OrderDetailsSection'

export function OrderMoneySummary({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const money = order?.money
  const format = (amount: string | null | undefined) =>
    money && amount != null ? orderMoneyLabel(amount, money.currency, i18n.language) : '—'
  const fields = [
    'subtotal',
    'discountTotal',
    'shippingFee',
    'personalizationTotal',
    'giftWrapFee',
    'taxableAmount',
  ] as const
  const facts = [
    ...fields.map((field) => [t(`orders.money.${field}`), format(money?.[field])]),
    [t('orders.money.vatRate'), money?.vat.rate != null ? `${money.vat.rate}%` : '—'],
    [t('orders.money.vatAmount'), format(money?.vat.amount)],
  ]
  return (
    <OrderDetailsSection title={t('orders.moneySummary')}>
      <dl className="space-y-4">
        {facts.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-wrap justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="[overflow-wrap:anywhere]">
              {order ? <bdi>{value}</bdi> : <Skeleton className="h-5 w-24" />}
            </dd>
          </div>
        ))}
        <div className="flex min-w-0 flex-wrap justify-between gap-2 border-t pt-4 text-xl font-bold">
          <dt>{t('orders.fields.total')}</dt>
          <dd className="[overflow-wrap:anywhere]">
            {order ? <bdi>{format(money?.total)}</bdi> : <Skeleton className="h-7 w-32" />}
          </dd>
        </div>
      </dl>
      <div className="min-h-5">
        {!order ? (
          <Skeleton className="h-5 w-32" />
        ) : order.coupon === null ? (
          <p className="text-sm text-muted-foreground">{t('orders.noCoupon')}</p>
        ) : null}
      </div>
    </OrderDetailsSection>
  )
}
