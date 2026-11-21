import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { EmptyState } from '@/components/shared/empty-state'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { Skeleton } from '@/components/ui/skeleton'
import { useAffiliateActivity } from '@/modules/affiliates/hooks/useAffiliateActivity'
import type { AffiliateAuditEvent } from '@/modules/affiliates/types/affiliate.types'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

const DISPLAY_FIELDS = ['name', 'mobile', 'email', 'platform', 'username', 'status'] as const

function displayValue(value: unknown, empty: string) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : empty
}

function EventChanges({ event }: { event: AffiliateAuditEvent }) {
  const { t } = useTranslation()
  const changes = DISPLAY_FIELDS.filter(
    (field) => event.previousState?.[field] !== event.newState?.[field] && field in (event.newState ?? {})
  )
  if (!changes.length) return null
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {changes.map((field) => (
        <li key={field} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
          <span className="font-medium text-foreground">{t(`affiliates.fields.${field}`)}</span>
          <span className="min-w-0 text-muted-foreground [overflow-wrap:anywhere]">
            <bdi>{displayValue(event.previousState?.[field], t('affiliates.activity.notAvailable'))}</bdi>
            <span aria-hidden="true"> → </span>
            <bdi>{displayValue(event.newState?.[field], t('affiliates.activity.notAvailable'))}</bdi>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function AffiliateActivity({ affiliateId }: { affiliateId: number }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const query = useAffiliateActivity(affiliateId)

  return (
    <section aria-labelledby="affiliate-activity-title">
      <DashboardCard padding="lg" className="space-y-5">
        <div>
          <h2 id="affiliate-activity-title" className="text-lg font-semibold">
            {t('affiliates.activity.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('affiliates.activity.description')}</p>
        </div>
        {query.isLoading ? (
          <div role="status" aria-label={t('affiliates.activity.loading')} className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : query.isError ? (
          <QueryStateNotice kind="loading-error" isRetrying={query.isFetching} onRetry={() => void query.refetch()} />
        ) : !query.data?.length ? (
          <EmptyState
            icon={<History />}
            title={t('affiliates.activity.emptyTitle')}
            description={t('affiliates.activity.emptyDescription')}
          />
        ) : (
          <ol className="relative space-y-0 border-s border-border ps-6">
            {query.data.map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -start-[1.79rem] top-1.5 size-3 rounded-full border-2 border-surface bg-primary" />
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{t(`affiliates.activity.${event.action}`)}</p>
                    <time className="text-sm text-muted-foreground" dateTime={event.createdAt}>
                      {formatDateTime(event.createdAt, { locale })}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t('affiliates.activity.actor')}</p>
                  <EventChanges event={event} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </DashboardCard>
    </section>
  )
}
