import { Snowflake } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { useCustomerLoyalty } from '@/modules/loyalty/hooks/useCustomerLoyalty'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

function SummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <DashboardCard key={index} padding="lg" className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
        </DashboardCard>
      ))}
    </div>
  )
}

export function CustomerLoyaltySummary({ query }: { query: ReturnType<typeof useCustomerLoyalty> }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const number = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB')
  const summary = query.data
  const expiry = summary?.expiringSoon?.expiresAt

  return (
    <section aria-labelledby="customer-loyalty-summary-title" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="customer-loyalty-summary-title" className="text-lg font-semibold">
          {t('loyalty.customer.summary.title')}
        </h2>
        {summary?.isBlocked ? (
          <Badge variant="warning">
            <Snowflake aria-hidden />
            {t('loyalty.customer.summary.frozen')}
          </Badge>
        ) : null}
      </div>
      <QueryStateBoundary
        loadingFallback={<SummarySkeleton />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !summary}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(summary)}
        onRetry={query.refetch}
      >
        {summary ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ['available', summary.available],
                ['pending', summary.pending],
                ['held', summary.held],
              ] as const
            ).map(([key, value]) => (
              <DashboardCard key={key} padding="lg" className="min-w-0 space-y-2">
                <h3 className="text-sm font-medium text-content-secondary">{t(`loyalty.customer.summary.${key}`)}</h3>
                <bdi className="block text-2xl font-semibold text-content-primary">{number.format(value)}</bdi>
              </DashboardCard>
            ))}
            <DashboardCard padding="lg" className="min-w-0 space-y-2">
              <h3 className="text-sm font-medium text-content-secondary">
                {t('loyalty.customer.summary.expiringSoon')}
              </h3>
              <bdi className="block text-2xl font-semibold text-content-primary">
                {summary.expiringSoon
                  ? number.format(summary.expiringSoon.points)
                  : t('loyalty.customer.summary.unavailable')}
              </bdi>
              {expiry ? (
                <p className="text-xs text-content-muted">
                  {t('loyalty.customer.summary.expiresAt', { date: formatDateTime(expiry, { locale }) })}
                </p>
              ) : null}
            </DashboardCard>
          </div>
        ) : null}
      </QueryStateBoundary>
    </section>
  )
}
