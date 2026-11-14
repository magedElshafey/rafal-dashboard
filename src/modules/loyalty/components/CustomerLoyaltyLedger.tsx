import { BookOpenText, CalendarClock } from 'lucide-react'
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
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomerLoyaltyLedger } from '@/modules/loyalty/hooks/useCustomerLoyaltyLedger'
import type { CustomerLoyaltyLedgerItem, LoyaltyLedgerFilters } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyLedgerDateState } from '@/modules/loyalty/utils/loyalty-ledger'
import { formatDateTime, resolveAppLocale, type AppLocale } from '@/utils/date/date.helpers'

function LedgerSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}

function LedgerDate({ value, unavailable, locale }: { value: string | null; unavailable: string; locale: AppLocale }) {
  const label = value ? formatDateTime(value, { locale }) : ''
  return value && label ? <time dateTime={value}>{label}</time> : <span>{unavailable}</span>
}

function signedPoints(value: number, language: string) {
  const number = new Intl.NumberFormat(language.startsWith('ar') ? 'ar-EG' : 'en-GB')
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${number.format(Math.abs(value))}`
}

function orderLabel(order: unknown | null, available: string, unavailable: string) {
  return order === null ? unavailable : available
}

function LedgerDesktop({ items }: { items: CustomerLoyaltyLedgerItem[] }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const unavailable = t('loyalty.customer.ledger.unavailable')
  const columns = [
    { id: 'date', header: t('loyalty.customer.ledger.fields.date') },
    { id: 'transaction', header: t('loyalty.customer.ledger.fields.transaction') },
    { id: 'points', header: t('loyalty.customer.ledger.fields.points') },
    { id: 'bucket', header: t('loyalty.customer.ledger.fields.bucket') },
    { id: 'order', header: t('loyalty.customer.ledger.fields.order') },
    { id: 'expiry', header: t('loyalty.customer.ledger.fields.expiry') },
    { id: 'actor', header: t('loyalty.customer.ledger.fields.actor') },
    { id: 'reason', header: t('loyalty.customer.ledger.fields.reason') },
  ]
  return (
    <ResponsiveDataDesktop>
      <ResponsiveDataTable columns={columns} aria-label={t('loyalty.customer.ledger.title')}>
        {items.map((item) => (
          <ResponsiveDataTableRow key={item.id}>
            <ResponsiveDataTableCell className="whitespace-normal">
              <LedgerDate value={item.createdAt} unavailable={unavailable} locale={locale} />
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell className="min-w-52 whitespace-normal">
              <p className="font-medium">{item.label || item.type}</p>
              <p className="text-xs text-content-muted">
                <bdi>{item.type}</bdi>
              </p>
              {item.note ? (
                <p className="mt-1 line-clamp-2 max-w-64 text-xs text-content-secondary" title={item.note}>
                  {item.note}
                </p>
              ) : null}
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell>
              <bdi dir="ltr" className="font-semibold">
                {signedPoints(item.points, i18n.language)}
              </bdi>
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell>
              <bdi>{item.bucket}</bdi>
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell>
              {orderLabel(item.order, t('loyalty.customer.ledger.orderAvailable'), unavailable)}
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell className="whitespace-normal">
              <LedgerDate value={item.lotExpiresAt} unavailable={unavailable} locale={locale} />
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell className="whitespace-normal">
              {item.actorName || item.actorType || unavailable}
            </ResponsiveDataTableCell>
            <ResponsiveDataTableCell className="whitespace-normal">
              {item.reasonLabel || item.reason || unavailable}
            </ResponsiveDataTableCell>
          </ResponsiveDataTableRow>
        ))}
      </ResponsiveDataTable>
    </ResponsiveDataDesktop>
  )
}

function LedgerMobile({ items }: { items: CustomerLoyaltyLedgerItem[] }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const unavailable = t('loyalty.customer.ledger.unavailable')
  return (
    <ResponsiveDataMobileCards>
      {items.map((item) => (
        <ResponsiveDataMobileCard
          key={item.id}
          title={item.label || item.type}
          subtitle={<LedgerDate value={item.createdAt} unavailable={unavailable} locale={locale} />}
          facts={
            <>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.points')}>
                <bdi dir="ltr">{signedPoints(item.points, i18n.language)}</bdi>
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.bucket')}>
                <bdi>{item.bucket}</bdi>
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.order')}>
                {orderLabel(item.order, t('loyalty.customer.ledger.orderAvailable'), unavailable)}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.expiry')}>
                <LedgerDate value={item.lotExpiresAt} unavailable={unavailable} locale={locale} />
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.actor')}>
                {item.actorName || item.actorType || unavailable}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('loyalty.customer.ledger.fields.reason')}>
                {item.reasonLabel || item.reason || unavailable}
              </ResponsiveDataFact>
            </>
          }
          footer={
            item.note ? (
              <p className="line-clamp-2 text-xs text-content-secondary" title={item.note}>
                {item.note}
              </p>
            ) : undefined
          }
        />
      ))}
    </ResponsiveDataMobileCards>
  )
}

export function CustomerLoyaltyLedger({ customerId, filters }: { customerId: number; filters: LoyaltyLedgerFilters }) {
  const { t } = useTranslation()
  const dateState = getLoyaltyLedgerDateState(filters)
  const query = useCustomerLoyaltyLedger(customerId, filters, true)
  const items = query.data?.items ?? []
  const header = (
    <div className="min-w-0 space-y-1">
      <h2 className="text-lg font-semibold">{t('loyalty.customer.ledger.title')}</h2>
      <p className="text-sm text-content-muted">
        {t('loyalty.customer.ledger.total', { count: query.data?.meta.total ?? items.length })}
      </p>
    </div>
  )

  if (dateState !== 'valid') {
    return (
      <ResponsiveDataLayout
        header={header}
        isEmpty
        empty={
          <EmptyState
            icon={<CalendarClock />}
            title={t('loyalty.customer.ledger.waitingForDates')}
            description={t('loyalty.customer.ledger.waitingForDatesDescription')}
          />
        }
      >
        {null}
      </ResponsiveDataLayout>
    )
  }

  return (
    <QueryStateBoundary
      loadingFallback={
        <ResponsiveDataLayout header={header} isEmpty={false} empty={null} isLoading loading={<LedgerSkeleton />}>
          {null}
        </ResponsiveDataLayout>
      }
      isLoading={query.isLoading}
      isLoadingError={query.isError && !query.data}
      isRefetchError={query.isRefetchError}
      isPaused={query.isPaused}
      isFetching={query.isFetching}
      hasData={Boolean(query.data)}
      onRetry={query.refetch}
    >
      <ResponsiveDataLayout
        header={header}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            icon={<BookOpenText />}
            title={t('loyalty.customer.ledger.emptyTitle')}
            description={t('loyalty.customer.ledger.emptyDescription')}
          />
        }
      >
        <LedgerDesktop items={items} />
        <LedgerMobile items={items} />
      </ResponsiveDataLayout>
    </QueryStateBoundary>
  )
}
