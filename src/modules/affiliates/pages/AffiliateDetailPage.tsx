import { isAffiliateFeatureEnabled } from '../config/affiliate-feature'
import { isAxiosError } from 'axios'
import { ArrowLeft, UserRoundX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
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
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const range = { from: params.get('from') || undefined, to: params.get('to') || undefined }
  const query = useAffiliate(id, range)
  if (!query.data && isAxiosError(query.error) && query.error.response?.status === 404) return <AffiliateNotFound />
  return (
    <main className="min-w-0 space-y-5">
      <div className="flex flex-wrap gap-4">
        {(['from', 'to'] as const).map((field) => (
          <label key={field} className="space-y-1">
            {t('affiliates.fields.' + field)}
            <input
              type="date"
              className="block rounded border p-2 focus-visible:outline-ring"
              value={range[field] || ''}
              onChange={(event) =>
                setParams((previous) => {
                  const next = new URLSearchParams(previous)
                  if (event.target.value) next.set(field, event.target.value)
                  else next.delete(field)
                  return next
                })
              }
            />
          </label>
        ))}
      </div>
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
          </>
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function AffiliateDetailPage() {
  const { id: routeId } = useParams()
  const id = Number(routeId)
  if (!isAffiliateFeatureEnabled) return null
  if (!/^[1-9]\d*$/.test(routeId ?? '') || !Number.isSafeInteger(id)) return <AffiliateNotFound />
  return <AffiliateDetails key={id} id={id} />
}
