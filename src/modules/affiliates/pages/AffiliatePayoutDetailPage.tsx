import { useAffiliateAccess } from '../config/affiliate-access'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { affiliatePayoutsService } from '../api/affiliate-review.service'
import { AffiliatePayoutDecision } from '../components/AffiliatePayoutDecision'
export default function AffiliatePayoutDetailPage() {
  const allowed = useAffiliateAccess('payouts')
  const canDecide = useAffiliateAccess('payoutDecision')
  const { t } = useTranslation()
  const { id: raw } = useParams()
  const id = Number(raw)
  const valid = /^[1-9]\d*$/.test(raw ?? '') && Number.isSafeInteger(id)
  const query = useQuery({
    queryKey: ['affiliates', 'payouts', 'detail', id],
    queryFn: ({ signal }) => affiliatePayoutsService.show(id, signal),
    enabled: allowed && valid,
    retry: false,
  })
  if (!allowed) return null
  if (!valid) return <DashboardPageHeader title={t('affiliates.detail.notFoundTitle')} />
  return (
    <main className="space-y-5">
      <DashboardPageHeader
        title={t('affiliates.payouts.title')}
        actions={
          <Button asChild variant="outline">
            <Link to={Routes.affiliatePayouts}>{t('affiliates.payouts.title')}</Link>
          </Button>
        }
      />
      <QueryStateBoundary
        loadingFallback={<Skeleton className="h-64 w-full" />}
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
            <dl className="grid gap-4 sm:grid-cols-2">
              <ResponsiveDataFact label={t('affiliates.fields.status')}>
                {t('affiliates.reviewStatus.' + query.data.payout.status)}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('affiliates.payouts.balance')}>
                <bdi>
                  {query.data.affiliate_available_balance == null
                    ? t('affiliates.summary.unavailable')
                    : `${query.data.affiliate_available_balance} ${t('affiliates.summary.currency')}`}
                </bdi>
              </ResponsiveDataFact>
              {(['amount', 'transfer_reference', 'transferred_at', 'rejection_reason'] as const).map((field) => (
                <ResponsiveDataFact
                  key={field}
                  label={t(
                    field === 'amount'
                      ? 'affiliates.payouts.amount'
                      : field === 'transfer_reference'
                        ? 'affiliates.payouts.reference'
                        : field === 'transferred_at'
                          ? 'affiliates.payouts.date'
                          : 'affiliates.fields.reason'
                  )}
                >
                  <bdi>
                    {query.data.payout[field] ?? t('affiliates.summary.unavailable')}
                    {field === 'amount' && query.data.payout.amount != null
                      ? ' ' + t('affiliates.summary.currency')
                      : ''}
                  </bdi>
                </ResponsiveDataFact>
              ))}
            </dl>
            {query.data.warning ? <p role="alert">{query.data.warning}</p> : null}
            {!canDecide ? <p role="note">{t('affiliates.payouts.readOnly')}</p> : null}
            <AffiliatePayoutDecision key={id} id={id} status={query.data.payout.status} refreshing={query.isFetching} />
          </>
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}
