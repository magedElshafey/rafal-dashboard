import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { formatDateTime } from '@/utils/date/date.helpers'
import type { OrderListItem, OrderStatusDefinition } from '../types/order.types'
import { customerLabel, orderMoneyLabel } from '../utils/order-presentation'
import { OrderStatusBadge } from './OrderStatusBadge'

const fields = [
  'number',
  'customer',
  'status',
  'paymentStatus',
  'items',
  'total',
  'gift',
  'warehouse',
  'placedAt',
  'actions',
]
export function OrdersList({ orders, definitions }: { orders: OrderListItem[]; definitions: OrderStatusDefinition[] }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const columns = fields.map((id) => ({ id, header: t(`orders.fields.${id}`) }))
  const values = (order: OrderListItem) => [
    <bdi>{order.displayNumber}</bdi>,
    <div className="max-w-56 whitespace-normal break-words">
      <bdi>{customerLabel(order.customer, t('orders.unavailable'))}</bdi>
      <p className="text-xs text-muted-foreground">
        <bdi>{order.customer.email}</bdi>
      </p>
      <p className="text-xs">
        <bdi>{order.customer.phone}</bdi>
      </p>
    </div>,
    <OrderStatusBadge value={order.status} definitions={definitions} />,
    <OrderStatusBadge value={order.paymentStatus} payment />,
    order.itemsCount,
    <bdi>{orderMoneyLabel(order.total, order.currency, i18n.language)}</bdi>,
    t(order.isGift ? 'orders.yes' : 'orders.no'),
    <bdi>{order.warehouse?.name || t('orders.unavailable')}</bdi>,
    formatDateTime(order.placedAt, { locale: i18n.language.startsWith('ar') ? 'ar' : 'en' }) || t('orders.unavailable'),
  ]
  const action = (order: OrderListItem) => (
    <DashboardCardActions
      actions={[
        {
          id: 'view',
          label: t('orders.view'),
          accessibleLabel: t('orders.viewNamed', { number: order.displayNumber }),
          icon: Eye,
          onClick: () => navigate(Routes.orderDetailPath(order.id)),
        },
      ]}
    />
  )
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {orders.map((order) => (
            <ResponsiveDataTableRow key={order.id}>
              {values(order).map((value, index) => (
                <ResponsiveDataTableCell key={fields[index]}>{value}</ResponsiveDataTableCell>
              ))}
              <ResponsiveDataTableCell>{action(order)}</ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {orders.map((order) => (
          <ResponsiveDataMobileCard
            key={order.id}
            title={<bdi>{order.displayNumber}</bdi>}
            actions={action(order)}
            facts={values(order)
              .slice(1)
              .map((value, index) => (
                <ResponsiveDataFact key={fields[index + 1]} label={t(`orders.fields.${fields[index + 1]}`)}>
                  {value}
                </ResponsiveDataFact>
              ))}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
export function OrdersListSkeleton() {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true">
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={fields.map((id) => ({ id, header: t(`orders.fields.${id}`) }))}>
          {Array.from({ length: 5 }, (_, row) => (
            <ResponsiveDataTableRow key={row}>
              {fields.map((field) => (
                <ResponsiveDataTableCell key={field}>
                  <Skeleton className="h-6 w-20" />
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {Array.from({ length: 3 }, (_, row) => (
          <Skeleton key={row} className="h-72 w-full" />
        ))}
      </ResponsiveDataMobileCards>
    </div>
  )
}
