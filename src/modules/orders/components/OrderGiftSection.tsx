import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrderDetail } from '../types/order.types'
import { customerLabel, humanizeOrderValue, orderMoneyLabel } from '../utils/order-presentation'
import { OrderDetailsFacts, OrderDetailsSection } from './OrderDetailsSection'

export function OrderGiftSection({ order }: { order?: OrderDetail }) {
  const { t, i18n } = useTranslation()
  const buyerId = useId()
  const recipientId = useId()
  const gift = order?.gift
  if (order && !gift) return null
  const buyer = gift?.buyer
  const recipient = gift?.recipient
  return (
    <OrderDetailsSection title={t('orders.fields.gift')}>
      <OrderDetailsFacts
        loading={!order}
        facts={[
          [t('orders.gift.anonymous'), t(gift?.isAnonymous ? 'orders.yes' : 'orders.no')],
          [t('orders.gift.wrap'), t(gift?.wrap ? 'orders.yes' : 'orders.no')],
          [
            t('orders.gift.wrapFee'),
            gift && order ? orderMoneyLabel(gift.wrapFee, order.money.currency, i18n.language) : '—',
          ],
          [t('orders.gift.message'), gift?.message?.trim() || '—'],
        ]}
      />
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        <section aria-labelledby={buyerId} className="min-w-0 space-y-3">
          <h3 id={buyerId} className="font-semibold">
            {t('orders.gift.buyer')}
          </h3>
          <OrderDetailsFacts
            loading={!order}
            facts={[
              [
                t('orders.type'),
                buyer
                  ? ['guest', 'registered'].includes(buyer.type)
                    ? t(`orders.values.${buyer.type}`)
                    : humanizeOrderValue(buyer.type)
                  : '—',
              ],
              [t('orders.name'), buyer ? customerLabel(buyer, '—') : '—'],
              [t('orders.email'), buyer?.email.trim() || '—'],
              [t('orders.phone'), buyer?.phone.trim() || '—'],
            ]}
          />
        </section>
        <section aria-labelledby={recipientId} className="min-w-0 space-y-3">
          <h3 id={recipientId} className="font-semibold">
            {t('orders.gift.recipient')}
          </h3>
          <address className="not-italic">
            <OrderDetailsFacts
              loading={!order}
              facts={[
                [t('orders.name'), recipient?.name.trim() || '—'],
                [t('orders.phone'), recipient?.phone.trim() || '—'],
                [t('orders.city'), recipient?.city?.name.trim() || '—'],
                [t('orders.district'), recipient?.district.trim() || '—'],
                [t('orders.street'), recipient?.streetDetails.trim() || '—'],
              ]}
            />
          </address>
        </section>
      </div>
    </OrderDetailsSection>
  )
}
