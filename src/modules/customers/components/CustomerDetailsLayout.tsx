import { QueryStateBoundary } from '@/components/shared/query-state'
import { QueryLoadingState } from '@/components/shared/query-state/components/QueryLoadingState'
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
  const customer = query.data
  const initialFailure = !customer && (query.isError || query.isPaused)
  return (
    <main className="min-w-0 space-y-5">
      {initialFailure ? <CustomerDetailsHeader /> : null}
      <QueryStateBoundary
        loadingFallback={
          <>
            <CustomerDetailsHeader loading />
            <CustomerProfileSections />
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
            <CustomerProfileSections customer={customer} />
          </>
        ) : null}
      </QueryStateBoundary>
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
    </main>
  )
}
