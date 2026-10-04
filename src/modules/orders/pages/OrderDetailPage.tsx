import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Routes } from '@/routes/routes'
import { formatDateTime } from '@/utils/date/date.helpers'
import { useOrder, useOrderStatuses } from '../hooks/useOrders'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { OrderStatusAction } from '../components/OrderStatusAction'
import { OrderItems } from '../components/OrderItems'
import { customerLabel, humanizeOrderValue, orderMoneyLabel, orderStatusLabel } from '../utils/order-presentation'
import type { OrderDetail, OrderStatusDefinition } from '../types/order.types'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border bg-surface p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}
function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3">
      {facts.map(([label, value]) => (
        <div key={label} className="grid min-w-0 gap-1 sm:grid-cols-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">
            <bdi>{value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  )
}
function OrderContent({
  order,
  definitions,
  refreshing,
}: {
  order: OrderDetail
  definitions: OrderStatusDefinition[]
  refreshing: boolean
}) {
  const { t, i18n } = useTranslation()
  const na = t('orders.unavailable')
  const date = (value: string | null) =>
    formatDateTime(value, { locale: i18n.language.startsWith('ar') ? 'ar' : 'en' }) || na
  const address = order.shippingAddress
  const moneyFields = [
    'subtotal',
    'discountTotal',
    'shippingFee',
    'personalizationTotal',
    'giftWrapFee',
    'taxableAmount',
  ] as const
  const history = [...order.statusHistory].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  const named = (value: string) =>
    ['guest', 'registered', 'system', 'admin', 'card'].includes(value)
      ? t(`orders.values.${value}`)
      : humanizeOrderValue(value)
  return (
    <>
      <DashboardPageHeader
        title={<bdi>{order.displayNumber}</bdi>}
        description={
          <>
            <OrderStatusBadge value={order.status} definitions={definitions} /> <span>{date(order.placedAt)}</span>
          </>
        }
        actions={<OrderStatusAction order={order} definitions={definitions} refreshing={refreshing} />}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Section title={t('orders.summary')}>
          <Facts
            facts={[
              [t('orders.fields.number'), order.orderNumber],
              [t('orders.fields.placedAt'), date(order.placedAt)],
              [t('orders.createdAt'), date(order.createdAt)],
              [t('orders.updatedAt'), date(order.updatedAt)],
              [t('orders.cancelledAt'), date(order.cancelledAt)],
            ]}
          />
        </Section>
        <Section title={t('orders.fields.customer')}>
          <Facts
            facts={[
              [t('orders.name'), customerLabel(order.customer, na)],
              [t('orders.type'), named(order.customer.type)],
              [t('orders.email'), order.customer.email || na],
              [t('orders.phone'), order.customer.phone || na],
            ]}
          />
        </Section>
        <Section title={t('orders.shippingAddress')}>
          {address ? (
            <address className="not-italic">
              <Facts
                facts={[
                  [t('orders.recipientName'), address.recipientName || na],
                  [t('orders.phone'), address.recipientPhone || na],
                  [t('orders.city'), address.city?.name || na],
                  [t('orders.district'), address.district || na],
                  [t('orders.street'), address.streetDetails || na],
                ]}
              />
            </address>
          ) : (
            <p>{na}</p>
          )}
        </Section>
        <Section title={t('orders.moneySummary')}>
          <Facts
            facts={[
              ...moneyFields.map((field): [string, ReactNode] => [
                t(`orders.money.${field}`),
                orderMoneyLabel(order.money[field], order.money.currency, i18n.language),
              ]),
              [t('orders.money.vatRate'), `${order.money.vat.rate}%`],
              [
                t('orders.money.vatAmount'),
                orderMoneyLabel(order.money.vat.amount, order.money.currency, i18n.language),
              ],
              [t('orders.fields.total'), orderMoneyLabel(order.money.total, order.money.currency, i18n.language)],
            ]}
          />
          {order.coupon === null && <p className="mt-4 text-sm text-muted-foreground">{t('orders.noCoupon')}</p>}
        </Section>
        <div className="min-w-0 lg:col-span-2">
          <Section title={t('orders.fields.items')}>
            <OrderItems items={order.items} currency={order.money.currency} />
          </Section>
        </div>
        <Section title={t('orders.payment')}>
          <Facts
            facts={[
              [t('orders.method'), named(order.payment.method)],
              [t('orders.fields.paymentStatus'), <OrderStatusBadge payment value={order.payment.status} />],
              [t('orders.reference'), order.payment.reference || na],
              [t('orders.paidAt'), date(order.payment.paidAt)],
            ]}
          />
        </Section>
        <Section title={t('orders.fields.warehouse')}>
          <Facts
            facts={[
              [t('orders.name'), order.warehouse?.name || na],
              [t('orders.id'), order.warehouse?.id ?? na],
            ]}
          />
        </Section>
        {order.gift !== null && (
          <div className="min-w-0 lg:col-span-2">
            <Section title={t('orders.fields.gift')}>
              <Facts
                facts={[
                  [t('orders.gift.anonymous'), t(order.gift.isAnonymous ? 'orders.yes' : 'orders.no')],
                  [t('orders.gift.message'), order.gift.message?.trim() ? order.gift.message : na],
                  [t('orders.gift.wrap'), t(order.gift.wrap ? 'orders.yes' : 'orders.no')],
                  [t('orders.gift.wrapFee'), orderMoneyLabel(order.gift.wrapFee, order.money.currency, i18n.language)],
                ]}
              />
              <div className="mt-6 grid min-w-0 gap-6 md:grid-cols-2">
                <section aria-labelledby="order-gift-buyer">
                  <h3 id="order-gift-buyer" className="mb-3 font-semibold">
                    {t('orders.gift.buyer')}
                  </h3>
                  <Facts
                    facts={[
                      [t('orders.type'), named(order.gift.buyer.type)],
                      [t('orders.name'), customerLabel(order.gift.buyer, na)],
                      [t('orders.email'), order.gift.buyer.email || na],
                      [t('orders.phone'), order.gift.buyer.phone || na],
                    ]}
                  />
                </section>
                <section aria-labelledby="order-gift-recipient">
                  <h3 id="order-gift-recipient" className="mb-3 font-semibold">
                    {t('orders.gift.recipient')}
                  </h3>
                  <address className="not-italic">
                    <Facts
                      facts={[
                        [t('orders.name'), order.gift.recipient.name || na],
                        [t('orders.phone'), order.gift.recipient.phone || na],
                        [t('orders.city'), order.gift.recipient.city?.name || na],
                        [t('orders.district'), order.gift.recipient.district || na],
                        [t('orders.street'), order.gift.recipient.streetDetails || na],
                      ]}
                    />
                  </address>
                </section>
              </div>
            </Section>
          </div>
        )}
        <div className="min-w-0 lg:col-span-2">
          <Section title={t('orders.history')}>
            <ol className="space-y-5 border-s ps-5">
              {history.map((entry, index) => (
                <li key={`${entry.createdAt}-${index}`} className="space-y-1">
                  <p>
                    {entry.fromStatus ? (
                      <>
                        {orderStatusLabel(entry.fromStatus, definitions, t)} <span aria-hidden="true"> / </span>
                      </>
                    ) : (
                      t('orders.initialEvent')
                    )}
                    {orderStatusLabel(entry.toStatus, definitions, t)}
                  </p>
                  <p className="text-sm">
                    <bdi>{entry.actorName || named(entry.actorType)}</bdi> ·{' '}
                    <time dateTime={entry.createdAt}>{date(entry.createdAt)}</time>
                  </p>
                  {entry.note && (
                    <p className="break-words text-sm text-muted-foreground">
                      <bdi>{entry.note}</bdi>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </>
  )
}
export default function OrderDetailPage() {
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  const query = useOrder(id)
  const statuses = useOrderStatuses()
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-4">
      <Button variant="outline" asChild>
        <Link to={Routes.orders}>{t('orders.back')}</Link>
      </Button>
      {!Number.isSafeInteger(id) ? (
        <p role="alert">{t('orders.invalidId')}</p>
      ) : (
        <QueryStateBoundary
          isLoading={query.isLoading}
          loadingFallback={
            <div aria-hidden="true" className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-24 lg:col-span-2" />
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-64" />
              ))}
            </div>
          }
          isLoadingError={query.isError && !query.data}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data)}
          onRetry={query.refetch}
        >
          {query.data && (
            <OrderContent
              key={id}
              order={query.data}
              definitions={statuses.data ?? []}
              refreshing={query.isFetching || query.isRefetchError}
            />
          )}
        </QueryStateBoundary>
      )}
    </main>
  )
}
