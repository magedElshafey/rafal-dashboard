import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { ReturnRequestBackLink, ReturnRequestWorkspace } from '../components/ReturnRequestWorkspace'
import { useReturnRequest } from '../hooks/useReturnRequests'

function ReturnRequestNotFound() {
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-5">
      <DashboardPageHeader title={t('returnRequests.workspace.notFound')} actions={<ReturnRequestBackLink />} />
      <p>{t('returnRequests.workspace.notFoundDescription')}</p>
    </main>
  )
}

function ReturnRequestDetails({ id }: { id: number }) {
  const query = useReturnRequest(id)
  const { t } = useTranslation()
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <ReturnRequestNotFound />
  return (
    <main className="min-w-0 space-y-5">
      {!query.data && (query.isError || query.isPaused) ? (
        <DashboardPageHeader title={t('returnRequests.details')} actions={<ReturnRequestBackLink />} />
      ) : null}
      <QueryStateBoundary
        isLoading={query.isLoading}
        loadingFallback={<ReturnRequestWorkspace />}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isError && Boolean(query.data)}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <ReturnRequestWorkspace request={query.data} disabled={query.isFetching || query.isError || query.isPaused} />
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function ReturnRequestDetailPage() {
  const { id: rawId } = useParams()
  const id = Number(rawId)
  if (!/^[1-9]\d*$/.test(rawId ?? '') || !Number.isSafeInteger(id)) return <ReturnRequestNotFound />
  return <ReturnRequestDetails key={id} id={id} />
}
