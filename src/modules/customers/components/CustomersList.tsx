import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { CustomerActions } from '@/modules/customers/components/CustomerActions'
import { CustomerAccessBadge, CustomerStatusBadge } from '@/modules/customers/components/CustomerStatusBadges'
import type { CustomerListItem } from '@/modules/customers/types/customer.types'
import { getCustomerDisplayName } from '@/modules/customers/utils/customer.utils'

type Props = {
  customers: readonly CustomerListItem[]
  onView: (customer: CustomerListItem) => void
  onAccessChange: (customer: CustomerListItem) => void
}

export function CustomersList({ customers, onView, onAccessChange }: Props) {
  const { t, i18n } = useTranslation()
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en', { maximumFractionDigits: 20 }),
    [i18n.language]
  )
  const columns = [
    { id: 'customer', header: t('customers.fields.customer') },
    { id: 'contact', header: t('customers.fields.contact') },
    { id: 'access', header: t('customers.fields.access'), className: 'w-36' },
    { id: 'orders', header: t('customers.fields.ordersCount'), className: 'w-24' },
    { id: 'spend', header: t('customers.fields.lifetimeSpend'), className: 'w-32' },
    { id: 'actions', header: t('customers.actions.label'), className: 'w-20' },
  ]
  const identity = (customer: CustomerListItem) =>
    getCustomerDisplayName(customer, t('customers.identityFallback', { id: customer.id }))
  const valueOrDash = (value: string | null) => value?.trim() || '—'
  const access = (customer: CustomerListItem) => (
    <div className="flex flex-wrap gap-1">
      <CustomerStatusBadge status={customer.status} />
      <CustomerAccessBadge isBlocked={customer.isBlocked} />
    </div>
  )

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {customers.map((customer) => {
            const displayName = identity(customer)
            return (
              <ResponsiveDataTableRow key={customer.id}>
                <ResponsiveDataTableCell className="max-w-60 whitespace-normal font-medium">
                  <bdi dir="auto" className="break-words">
                    {displayName}
                  </bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal">
                  <div className="break-all lowercase">{valueOrDash(customer.email)}</div>
                  <div className="text-xs text-muted-foreground">{valueOrDash(customer.phone)}</div>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{access(customer)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(customer.ordersCount)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(customer.lifetimeSpend)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <CustomerActions
                    customer={customer}
                    displayName={displayName}
                    onView={onView}
                    onAccessChange={onAccessChange}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {customers.map((customer) => {
          const displayName = identity(customer)
          return (
            <ResponsiveDataMobileCard
              key={customer.id}
              title={<bdi dir="auto">{displayName}</bdi>}
              subtitle={valueOrDash(customer.email)}
              actions={
                <CustomerActions
                  customer={customer}
                  displayName={displayName}
                  onView={onView}
                  onAccessChange={onAccessChange}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('customers.fields.phone')}>
                    {valueOrDash(customer.phone)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('customers.fields.access')}>{access(customer)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('customers.fields.ordersCount')}>
                    {numberFormatter.format(customer.ordersCount)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('customers.fields.lifetimeSpend')}>
                    {numberFormatter.format(customer.lifetimeSpend)}
                  </ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
