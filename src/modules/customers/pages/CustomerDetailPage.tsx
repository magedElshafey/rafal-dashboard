import { useState, type ReactNode } from 'react'
import { ArrowLeft, Ban, LockOpen, UserRoundX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { CustomerAccessDialog, type CustomerAccessTarget } from '@/modules/customers/components/CustomerAccessDialog'
import { CustomerDetailSkeleton } from '@/modules/customers/components/CustomerDetailSkeleton'
import { CustomerOrdersSection } from '@/modules/customers/components/CustomerOrdersSection'
import { CustomerAccessBadge, CustomerStatusBadge } from '@/modules/customers/components/CustomerStatusBadges'
import { useCustomer } from '@/modules/customers/hooks/useCustomer'
import { useCustomerOrders } from '@/modules/customers/hooks/useCustomerOrders'
import type { CustomerDetail } from '@/modules/customers/types/customer.types'
import { getCustomerDisplayName } from '@/modules/customers/utils/customer.utils'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

function DetailFact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

function CustomerDetails({ customer }: { customer: CustomerDetail }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const valueOrDash = (value: string | null) => value?.trim() || '—'
  const dateOrDash = (value: string | null) => (value ? formatDateTime(value, { locale }) || '—' : '—')

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DashboardCard className="space-y-5" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('customers.detail.identity')}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailFact label={t('customers.fields.name')}>{valueOrDash(customer.name)}</DetailFact>
          <DetailFact label={t('customers.fields.firstName')}>{valueOrDash(customer.firstName)}</DetailFact>
          <DetailFact label={t('customers.fields.lastName')}>{valueOrDash(customer.lastName)}</DetailFact>
          <DetailFact label={t('customers.fields.email')}>{valueOrDash(customer.email)}</DetailFact>
          <DetailFact label={t('customers.fields.phone')}>{valueOrDash(customer.phone)}</DetailFact>
        </dl>
      </DashboardCard>

      <DashboardCard className="space-y-5" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('customers.detail.account')}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailFact label={t('customers.fields.status')}>
            <CustomerStatusBadge status={customer.status} />
          </DetailFact>
          <DetailFact label={t('customers.fields.access')}>
            <CustomerAccessBadge isBlocked={customer.isBlocked} />
          </DetailFact>
          <DetailFact label={t('customers.fields.blockedAt')}>{dateOrDash(customer.blockedAt)}</DetailFact>
          <DetailFact label={t('customers.fields.blockedReason')}>{valueOrDash(customer.blockedReason)}</DetailFact>
          <DetailFact label={t('customers.fields.termsAcceptedAt')}>{dateOrDash(customer.termsAcceptedAt)}</DetailFact>
          <DetailFact label={t('customers.fields.marketingOptIn')}>
            {t(customer.marketingOptIn ? 'customers.values.yes' : 'customers.values.no')}
          </DetailFact>
        </dl>
      </DashboardCard>

      <DashboardCard className="space-y-5 lg:col-span-2" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('customers.detail.metrics')}</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <DetailFact label={t('customers.fields.addressesCount')}>{customer.addressesCount}</DetailFact>
          <DetailFact label={t('customers.fields.createdAt')}>{dateOrDash(customer.createdAt)}</DetailFact>
          <DetailFact label={t('customers.fields.updatedAt')}>{dateOrDash(customer.updatedAt)}</DetailFact>
        </dl>
      </DashboardCard>
    </div>
  )
}

function CustomerDetailPage() {
  const { id: routeId } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const parsedId = Number(routeId)
  const customerId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : null
  const customerQuery = useCustomer(customerId)
  const ordersQuery = useCustomerOrders(customerId)
  const [accessTarget, setAccessTarget] = useState<CustomerAccessTarget | null>(null)
  const customer = customerQuery.data
  const displayName = customer
    ? getCustomerDisplayName(customer, t('customers.identityFallback', { id: customer.id }))
    : t('customers.detail.title')
  const backAction = (
    <Button variant="outline" asChild>
      <Link to={Routes.customers}>
        <ArrowLeft aria-hidden="true" />
        {t('customers.actions.back')}
      </Link>
    </Button>
  )
  const accessAction = customer ? (
    <Button
      variant={customer.isBlocked ? 'outline' : 'destructive'}
      onClick={() =>
        setAccessTarget({
          id: customer.id,
          displayName,
          action: customer.isBlocked ? 'unblock' : 'block',
        })
      }
    >
      {customer.isBlocked ? <LockOpen aria-hidden="true" /> : <Ban aria-hidden="true" />}
      {t(customer.isBlocked ? 'customers.actions.unblock' : 'customers.actions.block')}
    </Button>
  ) : null

  if (customerId === null) {
    return (
      <main className="min-w-0">
        <DashboardPageHeader title={t('customers.detail.title')} actions={backAction} />
        <EmptyState
          icon={<UserRoundX />}
          title={t('customers.detail.invalid.title')}
          description={t('customers.detail.invalid.description')}
        />
      </main>
    )
  }

  return (
    <main className="min-w-0 space-y-6">
      <DashboardPageHeader
        title={displayName}
        description={t('customers.detail.description')}
        actions={
          <>
            {backAction}
            {accessAction}
          </>
        }
      />
      <QueryStateBoundary
        loadingFallback={<CustomerDetailSkeleton />}
        isLoading={customerQuery.isLoading}
        isLoadingError={customerQuery.isError && !customerQuery.data}
        isRefetchError={customerQuery.isRefetchError}
        isPaused={customerQuery.isPaused}
        isFetching={customerQuery.isFetching}
        hasData={Boolean(customerQuery.data)}
        onRetry={customerQuery.refetch}
      >
        {customer ? <CustomerDetails customer={customer} /> : null}
      </QueryStateBoundary>
      {customerQuery.isSuccess ? <CustomerOrdersSection query={ordersQuery} /> : null}
      <CustomerAccessDialog target={accessTarget} onClose={() => setAccessTarget(null)} />
    </main>
  )
}

export default CustomerDetailPage
