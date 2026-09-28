import { useMemo, useState } from 'react'
import { UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'
import { CustomerAccessDialog, type CustomerAccessTarget } from '@/modules/customers/components/CustomerAccessDialog'
import { CustomersList } from '@/modules/customers/components/CustomersList'
import { CustomersListSkeleton } from '@/modules/customers/components/CustomersListSkeleton'
import { useCustomers } from '@/modules/customers/hooks/useCustomers'
import type { CustomerListItem } from '@/modules/customers/types/customer.types'
import { getCustomerDisplayName } from '@/modules/customers/utils/customer.utils'
import { Routes } from '@/routes/routes'

function CustomersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const query = useCustomers()
  const [accessTarget, setAccessTarget] = useState<CustomerAccessTarget | null>(null)
  const customers = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const total = query.data?.pages.at(-1)?.paginate.total ?? customers.length
  const loadMoreRef = useInfiniteScroll({
    enabled: Boolean(query.hasNextPage && !query.isFetchingNextPage),
    onLoadMore: query.fetchNextPage,
    operationKey: query.data?.pages.length,
  })
  const header = (
    <div className="min-w-0">
      <h2 className="font-semibold text-foreground">{t('customers.listTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('customers.total', { count: total })}</p>
    </div>
  )
  const loading = (
    <ResponsiveDataLayout header={header} isEmpty={false} empty={null} isLoading loading={<CustomersListSkeleton />}>
      {null}
    </ResponsiveDataLayout>
  )
  const openAccessDialog = (customer: CustomerListItem) => {
    setAccessTarget({
      id: customer.id,
      displayName: getCustomerDisplayName(customer, t('customers.identityFallback', { id: customer.id })),
      action: customer.isBlocked ? 'unblock' : 'block',
    })
  }

  return (
    <main className="min-w-0">
      <DashboardPageHeader title={t('customers.title')} description={t('customers.description')} />
      <QueryStateBoundary
        loadingFallback={loading}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={customers.length > 0}
        onRetry={query.refetch}
      >
        <TableProvider data={customers} isLoading={query.isLoading} refetch={query.refetch} name="customers">
          <ResponsiveDataLayout
            header={header}
            isEmpty={customers.length === 0}
            empty={
              <EmptyState
                icon={<UsersRound />}
                title={t('customers.empty.title')}
                description={t('customers.empty.description')}
              />
            }
          >
            <CustomersList
              customers={customers}
              onView={(customer) => navigate(Routes.customerDetailPath(customer.id))}
              onAccessChange={openAccessDialog}
            />
            {query.isFetchNextPageError ? (
              <div className="p-4">
                <QueryStateNotice
                  kind="refetch-error"
                  isRetrying={query.isFetchingNextPage}
                  onRetry={() => void query.fetchNextPage()}
                />
              </div>
            ) : null}
            <div ref={loadMoreRef} className="flex min-h-1 justify-center p-4" aria-live="polite">
              {query.isFetchingNextPage ? (
                <>
                  <span className="sr-only">{t('customers.loadingMore')}</span>
                  <Skeleton aria-hidden="true" className="h-8 w-40" />
                </>
              ) : null}
            </div>
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
      <CustomerAccessDialog target={accessTarget} onClose={() => setAccessTarget(null)} />
    </main>
  )
}

export default CustomersPage
