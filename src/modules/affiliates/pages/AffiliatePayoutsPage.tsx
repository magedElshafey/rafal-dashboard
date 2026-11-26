import { useAffiliateAccess } from '../config/affiliate-access'
import { useSearchParams, Link } from 'react-router-dom'
import { Routes } from '@/routes/routes'
import { useTranslation } from 'react-i18next'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import {
  ResponsiveDataLayout,
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { affiliatePayoutsService } from '../api/affiliate-review.service'
export default function AffiliatePayoutsPage() {
  const allowed = useAffiliateAccess('payouts')
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const value = params.get('status')
  const status = ['pending', 'paid', 'rejected'].includes(value ?? '') ? value! : undefined
  const query = useInfinitePaginatedQuery({
    queryKey: ['affiliates', 'payouts', status ?? ''],
    queryFn: (page, signal) => affiliatePayoutsService.list(page, signal, status),
    enabled: allowed,
    retry: false,
  })
  const rows = query.data?.pages.flatMap((p) => p.items) ?? []
  const columns = ['name', 'code', 'amount', 'iban', 'status'].map((key) => ({
    id: key,
    header: t('affiliates.payouts.' + key),
  }))
  if (!allowed) return null
  return (
    <main className="space-y-5">
      <DashboardPageHeader title={t('affiliates.payouts.title')} />
      <label>
        {t('affiliates.fields.status')}
        <select
          className="ms-2 rounded border p-2 focus-visible:outline-ring"
          value={status ?? ''}
          onChange={(event) =>
            setParams((previous) => {
              const next = new URLSearchParams(previous)
              next.delete('page')
              if (event.target.value) next.set('status', event.target.value)
              else next.delete('status')
              return next
            })
          }
        >
          <option value="">{t('affiliates.filters.allStatuses')}</option>
          {['pending', 'paid', 'rejected'].map((s) => (
            <option key={s} value={s}>
              {t('affiliates.reviewStatus.' + s)}
            </option>
          ))}
        </select>
      </label>
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
        <ResponsiveDataLayout
          header={null}
          isEmpty={!rows.length}
          empty={<EmptyState title={t('affiliates.payouts.empty')} />}
        >
          <ResponsiveDataDesktop>
            <ResponsiveDataTable columns={columns}>
              {rows.map((row) => (
                <ResponsiveDataTableRow key={row.id}>
                  {columns.map((col) => (
                    <ResponsiveDataTableCell key={col.id}>
                      <bdi>
                        {col.id === 'name' ? (
                          <Link
                            className="underline focus-visible:outline-ring"
                            to={Routes.affiliatePayoutDetailPath(row.id)}
                          >
                            {row.affiliate.name}
                          </Link>
                        ) : col.id === 'status' ? (
                          t('affiliates.reviewStatus.' + row.status)
                        ) : col.id === 'amount' ? (
                          row.amount == null ? (
                            t('affiliates.summary.unavailable')
                          ) : (
                            `${row.amount} ${t('affiliates.summary.currency')}`
                          )
                        ) : col.id === 'iban' ? (
                          row.iban
                        ) : (
                          row.affiliate[col.id as 'name' | 'code']
                        )}
                      </bdi>
                    </ResponsiveDataTableCell>
                  ))}
                </ResponsiveDataTableRow>
              ))}
            </ResponsiveDataTable>
          </ResponsiveDataDesktop>
          <ResponsiveDataMobileCards>
            {rows.map((row) => (
              <ResponsiveDataMobileCard
                key={row.id}
                title={
                  <Link to={Routes.affiliatePayoutDetailPath(row.id)} className="underline focus-visible:outline-ring">
                    {row.affiliate.name}
                  </Link>
                }
                facts={
                  <>
                    {columns.slice(1).map((col) => (
                      <ResponsiveDataFact key={col.id} label={col.header}>
                        <bdi>
                          {col.id === 'status'
                            ? t('affiliates.reviewStatus.' + row.status)
                            : col.id === 'amount'
                              ? row.amount == null
                                ? t('affiliates.summary.unavailable')
                                : `${row.amount} ${t('affiliates.summary.currency')}`
                              : col.id === 'iban'
                                ? row.iban
                                : row.affiliate.code}
                        </bdi>
                      </ResponsiveDataFact>
                    ))}
                  </>
                }
              />
            ))}
          </ResponsiveDataMobileCards>
        </ResponsiveDataLayout>
        {query.hasNextPage ? (
          <Button disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {t(query.isFetchNextPageError ? 'affiliates.actions.retry' : 'affiliates.actions.loadMore')}
          </Button>
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}
