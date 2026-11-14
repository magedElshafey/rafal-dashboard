import { useTranslation } from 'react-i18next'

import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryLoadingState } from '@/components/shared/query-state/components/QueryLoadingState'
import QueryTabsFilter from '@/components/shared/tabs/QueryTabsFilter'
import { CustomerLoyaltyWorkspace } from '@/modules/loyalty/components/CustomerLoyaltyWorkspace'
import { useQuery } from '@/store/queryContext/useQueryContext'
import type { useCustomer } from '../hooks/useCustomer'
import { CustomerDetailsHeader } from './CustomerDetailsHeader'
import { CustomerProfileSections, CustomerMetadataSection } from './CustomerProfileSections'
import { CustomerOrdersSection } from './CustomerOrdersSection'

export function CustomerDetailsLayout({
  customerId,
  query,
}: {
  customerId: number
  query: ReturnType<typeof useCustomer>
}) {
  const { t } = useTranslation()
  const { forwardQuery } = useQuery()
  const activeTab = forwardQuery?.tab === 'points' ? 'points' : 'overview'
  const isOverview = activeTab === 'overview'
  const customer = query.data
  const initialFailure = !customer && (query.isError || query.isPaused)
  const tabs = (
    <QueryTabsFilter
      name="tab"
      tabs={[
        { value: 'overview', label: t('customers.detail.tabs.overview') },
        { value: 'points', label: t('customers.detail.tabs.points') },
      ]}
      value={activeTab}
      defaultValue="overview"
      variant="underline"
      ariaLabel={t('customers.detail.tabs.label')}
      id="customer-details-tabs"
      panelId="customer-details-active-panel"
    />
  )
  return (
    <main className="min-w-0 space-y-5">
      {initialFailure ? <CustomerDetailsHeader /> : null}
      <QueryStateBoundary
        loadingFallback={
          <>
            <CustomerDetailsHeader loading />
            {isOverview ? <CustomerProfileSections /> : null}
          </>
        }
        isLoading={query.isLoading}
        isLoadingError={query.isError && !customer}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(customer)}
        onRetry={query.refetch}
      >
        {customer ? (
          <>
            <CustomerDetailsHeader customer={customer} refreshing={query.isFetching || query.isRefetchError} />
            {tabs}
            {isOverview ? <CustomerProfileSections customer={customer} /> : null}
          </>
        ) : null}
      </QueryStateBoundary>
      <div
        id="customer-details-active-panel"
        role="tabpanel"
        aria-labelledby={`customer-details-tabs-tab-${activeTab}`}
      >
        {isOverview ? (
          <>
            {/* Keep this independent observer mounted across core loading/success to avoid a second Orders GET. */}
            <div hidden={initialFailure}>
              <CustomerOrdersSection customerId={customerId} profileReady={Boolean(customer)} />
            </div>
            {!initialFailure ? (
              customer ? (
                <CustomerMetadataSection customer={customer} />
              ) : (
                <QueryLoadingState fallback={<CustomerMetadataSection />} />
              )
            ) : null}
          </>
        ) : customer ? (
          <CustomerLoyaltyWorkspace customerId={customerId} />
        ) : null}
      </div>
    </main>
  )
}
