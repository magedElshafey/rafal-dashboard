import type { TFunction } from 'i18next'
import { History } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataLayout,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { EmptyState } from '@/components/shared/empty-state'
import PaginatedListFooter from '@/components/shared/pagination/PaginatedListFooter'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoyaltyVersions } from '@/modules/loyalty/hooks/useLoyaltyVersions'
import { orderMoneyLabel } from '@/modules/orders/utils/order-presentation'
import type { LoyaltySettingsVersion, LoyaltyVersionValues } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyVersionChanges, type LoyaltyHistoryField } from '@/modules/loyalty/utils/loyalty-history'
import { loyaltyPagination } from '@/modules/loyalty/utils/loyalty-pagination'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type HistoryValue = LoyaltyVersionValues[LoyaltyHistoryField] | null

function localizedNumber(value: number, language: string) {
  return new Intl.NumberFormat(language.startsWith('ar') ? 'ar' : 'en', { maximumFractionDigits: 20 }).format(value)
}

function formatHistoryValue(value: HistoryValue, field: LoyaltyHistoryField, t: TFunction, language: string) {
  if (value === null) return t('loyalty.history.unavailable')
  if (field === 'isEnabled') return t(value ? 'loyalty.history.values.enabled' : 'loyalty.history.values.disabled')
  if (field === 'amountPerPoint' || field === 'redeemAmount') {
    return orderMoneyLabel(String(value), 'SAR', language)
  }

  const number = localizedNumber(Number(value), language)
  if (field === 'maxRedeemPercent' || field === 'effectiveReturnPercent') return `${number}%`
  if (field === 'redeemPoints' || field === 'minRedeemPoints') {
    return t('loyalty.history.values.points', { count: Number(value), formattedCount: number })
  }
  if (field === 'validityMonths') {
    return t('loyalty.history.values.months', { count: Number(value), formattedCount: number })
  }
  return t('loyalty.history.values.days', { count: Number(value), formattedCount: number })
}

function HistoryValueText({
  value,
  field,
  prominent = false,
}: {
  value: HistoryValue
  field: LoyaltyHistoryField
  prominent?: boolean
}) {
  const { t, i18n } = useTranslation()
  return (
    <bdi className={prominent ? 'font-semibold text-content-primary' : 'text-content-secondary'}>
      {formatHistoryValue(value, field, t, i18n.language)}
    </bdi>
  )
}

function DesktopChanges({ version }: { version: LoyaltySettingsVersion }) {
  const { t } = useTranslation()
  const changes = getLoyaltyVersionChanges(version)
  const isInitial = version.previousValues === null

  if (!changes.length) return <span className="text-sm text-content-secondary">{t('loyalty.history.noChanges')}</span>

  return (
    <div className="min-w-[30rem] max-w-3xl space-y-2">
      {isInitial ? <Badge variant="outline">{t('loyalty.history.initialConfiguration')}</Badge> : null}
      <table className="w-full table-fixed text-sm" aria-label={t('loyalty.history.comparison')}>
        <thead>
          <tr className="border-b border-border-subtle text-xs text-content-muted">
            <th scope="col" className="w-2/5 pb-2 pe-3 text-start font-medium">
              {t('loyalty.history.field')}
            </th>
            {!isInitial ? (
              <th scope="col" className="w-[30%] px-3 pb-2 text-start font-medium">
                {t('loyalty.history.previous')}
              </th>
            ) : null}
            <th scope="col" className="w-[30%] ps-3 pb-2 text-start font-medium">
              {t(isInitial ? 'loyalty.history.configuredValue' : 'loyalty.history.updated')}
            </th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.field} className="border-b border-border-subtle last:border-0">
              <th scope="row" className="break-words py-2 pe-3 text-start align-top font-medium whitespace-normal">
                {t(`loyalty.history.fields.${change.field}`)}
              </th>
              {!isInitial ? (
                <td className="break-words px-3 py-2 align-top whitespace-normal">
                  <HistoryValueText value={change.before} field={change.field} />
                </td>
              ) : null}
              <td className="break-words py-2 ps-3 align-top whitespace-normal">
                <HistoryValueText value={change.after} field={change.field} prominent />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileChanges({ version }: { version: LoyaltySettingsVersion }) {
  const { t } = useTranslation()
  const changes = getLoyaltyVersionChanges(version)
  const isInitial = version.previousValues === null

  if (!changes.length) return <span className="text-content-secondary">{t('loyalty.history.noChanges')}</span>

  return (
    <div className="space-y-3">
      {isInitial ? <Badge variant="outline">{t('loyalty.history.initialConfiguration')}</Badge> : null}
      {changes.map((change) => (
        <div key={change.field} className="min-w-0 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
          <p className="break-words font-medium text-content-primary">{t(`loyalty.history.fields.${change.field}`)}</p>
          <dl className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {!isInitial ? (
              <div className="min-w-0">
                <dt className="text-xs font-normal text-content-muted">{t('loyalty.history.previous')}</dt>
                <dd className="mt-0.5 break-words font-normal">
                  <HistoryValueText value={change.before} field={change.field} />
                </dd>
              </div>
            ) : null}
            <div className="min-w-0">
              <dt className="text-xs font-normal text-content-muted">
                {t(isInitial ? 'loyalty.history.configuredValue' : 'loyalty.history.updated')}
              </dt>
              <dd className="mt-0.5 break-words font-normal">
                <HistoryValueText value={change.after} field={change.field} prominent />
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export function LoyaltySettingsHistory({ page }: { page: number }) {
  const { t, i18n } = useTranslation()
  const { forwardAddQuery } = useQuery()
  const query = useLoyaltyVersions(page)
  const versions = query.data?.items ?? []
  const correctedPage =
    query.data && page > query.data.meta.last_page
      ? Math.max(1, Math.min(query.data.meta.current_page, query.data.meta.last_page))
      : page
  useEffect(() => {
    if (correctedPage !== page) forwardAddQuery({ page: String(correctedPage) }, { replace: true })
  }, [correctedPage, forwardAddQuery, page])
  const locale = resolveAppLocale(i18n.language)
  const header = (
    <div className="min-w-0">
      <h2 className="font-semibold">{t('loyalty.history.title')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('loyalty.history.total', { count: query.data?.meta.total ?? versions.length })}
      </p>
    </div>
  )
  const columns = [
    { id: 'savedAt', header: t('loyalty.history.savedAt'), className: 'w-48' },
    { id: 'admin', header: t('loyalty.history.admin'), className: 'w-40' },
    { id: 'changes', header: t('loyalty.history.changes') },
  ]

  return (
    <QueryStateBoundary
      loadingFallback={
        <ResponsiveDataLayout header={header} isEmpty={false} empty={null} isLoading loading={<HistorySkeleton />}>
          {null}
        </ResponsiveDataLayout>
      }
      isLoading={query.isLoading || correctedPage !== page}
      isLoadingError={query.isError && !query.data}
      isRefetchError={query.isRefetchError}
      isPaused={query.isPaused}
      isFetching={query.isFetching}
      hasData={Boolean(query.data) && correctedPage === page}
      onRetry={query.refetch}
    >
      <div className="space-y-4">
        <ResponsiveDataLayout
          header={header}
          isEmpty={versions.length === 0}
          empty={
            <EmptyState
              icon={<History />}
              title={t('loyalty.history.emptyTitle')}
              description={t('loyalty.history.emptyDescription')}
            />
          }
        >
          <ResponsiveDataDesktop>
            <ResponsiveDataTable columns={columns} aria-label={t('loyalty.history.title')}>
              {versions.map((version) => (
                <ResponsiveDataTableRow key={version.id}>
                  <ResponsiveDataTableCell className="align-top">
                    <time dateTime={version.savedAt}>{formatDateTime(version.savedAt, { locale }) || '—'}</time>
                  </ResponsiveDataTableCell>
                  <ResponsiveDataTableCell className="align-top whitespace-normal">
                    {version.admin.name}
                  </ResponsiveDataTableCell>
                  <ResponsiveDataTableCell className="align-top whitespace-normal">
                    <DesktopChanges version={version} />
                  </ResponsiveDataTableCell>
                </ResponsiveDataTableRow>
              ))}
            </ResponsiveDataTable>
          </ResponsiveDataDesktop>
          <ResponsiveDataMobileCards>
            {versions.map((version) => (
              <ResponsiveDataMobileCard
                key={version.id}
                title={<time dateTime={version.savedAt}>{formatDateTime(version.savedAt, { locale }) || '—'}</time>}
                subtitle={version.admin.name}
                facts={
                  <ResponsiveDataFact label={t('loyalty.history.changes')}>
                    <MobileChanges version={version} />
                  </ResponsiveDataFact>
                }
              />
            ))}
          </ResponsiveDataMobileCards>
        </ResponsiveDataLayout>
        {query.data && correctedPage === page ? (
          <PaginatedListFooter
            pagination={loyaltyPagination(query.data.meta, versions.length)}
            itemCount={versions.length}
            getRangeLabel={({ start, end, total }) => t('loyalty.history.range', { start, end, total })}
          />
        ) : null}
      </div>
    </QueryStateBoundary>
  )
}
