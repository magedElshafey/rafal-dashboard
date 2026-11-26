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
import { affiliateApplicationsService } from '../api/affiliate-review.service'
export default function AffiliateApplicationsPage() {
  const allowed = useAffiliateAccess('view')
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const value = params.get('status')
  const status = ['pending', 'approved', 'rejected'].includes(value ?? '') ? value! : undefined
  const query = useInfinitePaginatedQuery({
    queryKey: ['affiliates', 'applications', status ?? ''],
    queryFn: (page, signal) => affiliateApplicationsService.list(page, signal, status),
    enabled: allowed,
    retry: false,
  })
  const rows = query.data?.pages.flatMap((p) => p.items) ?? []
  const columns = ['name', 'phone', 'platform', 'followers_range', 'status'].map((key) => ({
    id: key,
    header: t('affiliates.applications.' + key),
  }))
  if (!allowed) return null
  return (
    <main className="space-y-5">
      <DashboardPageHeader title={t('affiliates.applications.title')} />
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
          {['pending', 'approved', 'rejected'].map((s) => (
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
        {query.data ? (
          <p>{t('affiliates.applications.pendingCount', { count: query.data.pages[0].extra.pendingCount })}</p>
        ) : null}
        <ResponsiveDataLayout
          header={null}
          isEmpty={!rows.length}
          empty={<EmptyState title={t('affiliates.applications.empty')} />}
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
                            to={Routes.affiliateApplicationDetailPath(row.id)}
                          >
                            {row.name}
                          </Link>
                        ) : col.id === 'status' ? (
                          t('affiliates.reviewStatus.' + row.status)
                        ) : (
                          row[col.id as 'name' | 'phone' | 'platform' | 'followers_range']
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
                  <Link
                    to={Routes.affiliateApplicationDetailPath(row.id)}
                    className="underline focus-visible:outline-ring"
                  >
                    {row.name}
                  </Link>
                }
                facts={
                  <>
                    {columns.slice(1).map((col) => (
                      <ResponsiveDataFact key={col.id} label={col.header}>
                        <bdi>
                          {col.id === 'status'
                            ? t('affiliates.reviewStatus.' + row.status)
                            : row[col.id as 'phone' | 'platform' | 'followers_range']}
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
