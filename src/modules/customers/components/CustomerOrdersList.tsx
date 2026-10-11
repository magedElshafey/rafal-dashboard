import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/modules/orders/components/OrderStatusBadge'
import { orderMoneyLabel } from '@/modules/orders/utils/order-presentation'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { CustomerOrderListItem } from '../types/customer.types'

export function CustomerOrdersList({ orders }: { orders?: CustomerOrderListItem[] }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const fields = ['number', 'status', 'items', 'total', 'payment', 'gift', 'placedAt']
  const rows = orders ?? Array.from({ length: 3 }, () => undefined)
  const identity = (order?: CustomerOrderListItem) =>
    order ? (
      <Link
        to={Routes.orderDetailPath(order.id)}
        className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]"
        aria-label={t('orders.viewNamed', {
          number:
            order.displayNumber.trim() ||
            order.orderNumber.trim() ||
            t('customers.orders.identityFallback', { id: order.id }),
        })}
      >
        <bdi>
          {order.displayNumber.trim() ||
            order.orderNumber.trim() ||
            t('customers.orders.identityFallback', { id: order.id })}
        </bdi>
      </Link>
    ) : (
      <Skeleton className="h-5 w-28" />
    )
  const values = (order?: CustomerOrderListItem) =>
    order
      ? [
          <OrderStatusBadge value={order.status} />,
          new Intl.NumberFormat(locale).format(order.itemsCount),
          <bdi>{orderMoneyLabel(order.total, order.currency, i18n.language)}</bdi>,
          <OrderStatusBadge value={order.paymentStatus} payment />,
          t(order.isGift ? 'customers.values.yes' : 'customers.values.no'),
          formatDateTime(order.placedAt, { locale }) || '—',
        ]
      : fields.slice(1).map(() => <Skeleton className="h-5 w-24 max-w-full" />)
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable
          columns={fields.map((id) => ({ id, header: t(`customers.orders.fields.${id}`) }))}
          aria-label={t('customers.orders.title')}
        >
          {rows.map((order, index) => (
            <ResponsiveDataTableRow key={order?.id ?? index}>
              <ResponsiveDataTableCell className="max-w-56 whitespace-normal">
                {identity(order)}
              </ResponsiveDataTableCell>
              {values(order).map((value, cell) => (
                <ResponsiveDataTableCell
                  key={fields[cell + 1]}
                  className="max-w-48 whitespace-normal [overflow-wrap:anywhere]"
                >
                  {value}
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {rows.map((order, index) => (
          <ResponsiveDataMobileCard
            key={order?.id ?? index}
            title={
              order ? (
                identity(order)
              ) : (
                <span className="inline-block min-h-5">{t('customers.orders.fields.number')}</span>
              )
            }
            facts={values(order).map((value, cell) => (
              <ResponsiveDataFact key={fields[cell + 1]} label={t(`customers.orders.fields.${fields[cell + 1]}`)}>
                {value}
              </ResponsiveDataFact>
            ))}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
