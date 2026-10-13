import { useState } from 'react'
import { ArrowLeft, Ban, LockOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import type { CustomerDetail } from '../types/customer.types'
import { getCustomerDisplayName } from '../utils/customer.utils'
import { CustomerAccessDialog, type CustomerAccessTarget } from './CustomerAccessDialog'
import { CustomerStatusBadge, CustomerAccessBadge } from './CustomerStatusBadges'

export function CustomerDetailsHeader({
  customer,
  loading = false,
  refreshing = false,
}: {
  customer?: CustomerDetail
  loading?: boolean
  refreshing?: boolean
}) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<CustomerAccessTarget | null>(null)
  const name = customer ? getCustomerDisplayName(customer, t('customers.detail.title')) : t('customers.detail.title')
  const action = customer?.isBlocked ? 'unblock' : 'block'
  return (
    <>
      <div className="relative">
        <DashboardPageHeader
          title={<bdi className={`block min-h-9 [overflow-wrap:anywhere] ${loading ? 'invisible' : ''}`}>{name}</bdi>}
          description={
            customer ? (
              <span className="inline-flex min-h-6 flex-wrap items-center gap-2 [overflow-wrap:anywhere]">
                <CustomerStatusBadge status={customer.status} />
                <CustomerAccessBadge isBlocked={customer.isBlocked} />
                {customer.email?.trim() ? <bdi>{customer.email}</bdi> : null}
                {customer.phone?.trim() ? <bdi>{customer.phone}</bdi> : null}
              </span>
            ) : loading ? (
              <span className="inline-block h-6" />
            ) : undefined
          }
          actions={
            loading ? (
              <>
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-24" />
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to={Routes.customers}>
                    <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
                    {t('customers.actions.back')}
                  </Link>
                </Button>
                {customer ? (
                  <Button
                    variant={customer.isBlocked ? 'outline' : 'destructive'}
                    disabled={refreshing}
                    onClick={() => setTarget({ id: customer.id, displayName: name, action })}
                  >
                    {customer.isBlocked ? <LockOpen aria-hidden="true" /> : <Ban aria-hidden="true" />}
                    {t(`customers.actions.${action}`)}
                  </Button>
                ) : null}
              </>
            )
          }
        />
        {/* Keep the div-based primitive outside h1/p phrasing content. */}
        {loading ? (
          <>
            <Skeleton className="pointer-events-none absolute start-0 top-0 h-9 w-64 max-w-full" />
            <Skeleton className="pointer-events-none absolute start-0 top-10 h-6 w-48 max-w-full" />
          </>
        ) : null}
      </div>
      {customer ? (
        <CustomerAccessDialog
          target={target}
          onClose={() => setTarget(null)}
          disabled={refreshing || Boolean(target && target.action !== action)}
        />
      ) : null}
    </>
  )
}
