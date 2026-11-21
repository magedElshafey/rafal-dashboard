import { isAxiosError } from 'axios'
import { ArrowLeft, UserRoundX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { AffiliateActivity } from '@/modules/affiliates/components/AffiliateActivity'
import { AffiliateDetailsHeader } from '@/modules/affiliates/components/AffiliateDetailsHeader'
import { AffiliateDetailsSections } from '@/modules/affiliates/components/AffiliateDetailsSections'
import { useAffiliate } from '@/modules/affiliates/hooks/useAffiliate'
import { Routes } from '@/routes/routes'

function AffiliateNotFound() {
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-5">
      <DashboardPageHeader
        title={t('affiliates.detail.title')}
        actions={
          <Button asChild variant="outline">
            <Link to={Routes.affiliates}>
              <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
              {t('affiliates.actions.back')}
            </Link>
          </Button>
        }
      />
      <EmptyState
        icon={<UserRoundX />}
        title={t('affiliates.detail.notFoundTitle')}
        description={t('affiliates.detail.notFoundDescription')}
      />
    </main>
  )
}

function AffiliateDetails({ id }: { id: number }) {
  const query = useAffiliate(id)
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <AffiliateNotFound />
  return (
    <main className="min-w-0 space-y-5">
      <QueryStateBoundary
        loadingFallback={<AffiliateDetailsSections />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !query.data}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(query.data)}
        onRetry={query.refetch}
      >
        {query.data ? (
          <>
            <AffiliateDetailsHeader affiliate={query.data} refreshing={query.isFetching} />
            <AffiliateDetailsSections affiliate={query.data} />
            <AffiliateActivity affiliateId={id} />
          </>
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function AffiliateDetailPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  if (!/^[1-9]\d*$/.test(routeId ?? '') || !Number.isSafeInteger(id)) return <AffiliateNotFound />
  return <AffiliateDetails key={id} id={id} />
}
