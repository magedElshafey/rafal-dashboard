import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { OrderDetail } from '../types/order.types'
import { humanizeOrderValue, orderMoneyLabel } from '../utils/order-presentation'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'

export function OrderLoyaltySection({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const loyalty = order?.loyalty
  const currency = order?.money.currency
  const numbers = new Intl.NumberFormat(resolveAppLocale(i18n.language))
  const status = loyalty?.earnedStatus
  const statusLabel = status
    ? ['pending', 'cancelled'].includes(status)
      ? t(`orders.loyalty.status.${status}`)
      : humanizeOrderValue(status)
    : '—'
  const money = (value: string | null | undefined) =>
    value != null && currency ? orderMoneyLabel(value, currency, i18n.language) : '—'

  return (
    <OrderDetailsSection title={t('orders.loyalty.title')}>
      {order && !loyalty ? <p className="text-sm text-muted-foreground">{t('orders.loyalty.unavailable')}</p> : null}
      <OrderDetailsFacts
        loading={!order}
        facts={[
          [t('orders.loyalty.earnedStatus'), status ? <Badge variant="outline">{statusLabel}</Badge> : '—'],
          [t('orders.loyalty.pointsEarned'), loyalty ? numbers.format(loyalty.pointsEarned) : '—'],
          [
            t('orders.loyalty.availableOn'),
            formatDateTime(loyalty?.availableOn, { locale: resolveAppLocale(i18n.language) }) || '—',
          ],
          [t('orders.loyalty.returnWindowDays'), loyalty ? numbers.format(loyalty.returnWindowDays) : '—'],
          [t('orders.loyalty.pointsRedeemed'), loyalty ? numbers.format(loyalty.pointsRedeemed) : '—'],
          [t('orders.loyalty.amountApplied'), money(loyalty?.amountApplied)],
          [t('orders.loyalty.amountDue'), money(loyalty?.amountDue)],
          [
            t('orders.loyalty.valuePerPoint'),
            loyalty?.valuePerPoint != null ? money(String(loyalty.valuePerPoint)) : '—',
          ],
          [t('orders.loyalty.pointsReturned'), loyalty ? numbers.format(loyalty.pointsReturned) : '—'],
          [t('orders.loyalty.amountPerPoint'), money(loyalty?.amountPerPoint)],
          [t('orders.loyalty.ruleVersion'), loyalty ? numbers.format(loyalty.ruleVersionId) : '—'],
        ]}
      />
    </OrderDetailsSection>
  )
}
