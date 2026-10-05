import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataLayout } from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { TableProvider } from '@/components/ui/Table/TableProvider'
import { ReturnRequestsList, ReturnRequestsListSkeleton } from '../components/ReturnRequestsList'
import { useReturnRequests } from '../hooks/useReturnRequests'

export default function ReturnRequestsPage() {
  const { t } = useTranslation()
  const query = useReturnRequests()
  const requests = query.data?.items ?? []
  return (
    <main className="min-w-0 space-y-4">
      <DashboardPageHeader title={t('returnRequests.title')} />
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<ReturnRequestsListSkeleton />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        <TableProvider name="return-requests" data={requests} isLoading={query.isLoading} refetch={query.refetch}>
          <ResponsiveDataLayout
            header={<h2 className="font-semibold">{t('returnRequests.listTitle', { count: requests.length })}</h2>}
            isEmpty={requests.length === 0}
            empty={<EmptyState title={t('returnRequests.empty')} description={t('returnRequests.emptyDescription')} />}
          >
            <ReturnRequestsList requests={requests} />
          </ResponsiveDataLayout>
        </TableProvider>
      </QueryStateBoundary>
    </main>
  )
}
