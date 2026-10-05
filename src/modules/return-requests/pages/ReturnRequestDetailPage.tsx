import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { formatDateTime } from '@/utils/date/date.helpers'
import { ReturnRequestDecisionActions } from '../components/ReturnRequestDecisionActions'
import { ReturnRequestStatusBadge } from '../components/ReturnRequestStatusBadge'
import { useReturnRequest } from '../hooks/useReturnRequests'
import type { ReturnRequest } from '../types/return-request.types'
import {
  humanizeReturnRequestValue,
  returnRequestIdentityLabel,
  returnRequestReasonLabel,
} from '../utils/return-request-presentation'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border bg-surface p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="space-y-3">
      {facts.map(([label, value]) => (
        <div key={label} className="grid min-w-0 gap-1 sm:grid-cols-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReturnRequestContent({ request, refreshing }: { request: ReturnRequest; refreshing: boolean }) {
  const { t, i18n } = useTranslation()
  const unavailable = t('returnRequests.unavailable')
  const date = (value: string | null) =>
    value ? formatDateTime(value, { locale: i18n.language.startsWith('ar') ? 'ar' : 'en' }) || unavailable : unavailable
  const userName = returnRequestIdentityLabel(request.user.name, request.user.email, unavailable)
  const adminName = request.decidedByAdmin
    ? returnRequestIdentityLabel(request.decidedByAdmin.name, request.decidedByAdmin.email, unavailable)
    : unavailable
  return (
    <>
      <DashboardPageHeader
        title={<bdi>{t('returnRequests.requestTitle', { id: request.id })}</bdi>}
        description={<ReturnRequestStatusBadge value={request.status} />}
        actions={<ReturnRequestDecisionActions request={request} refreshing={refreshing} />}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Section title={t('returnRequests.sections.request')}>
          <Facts
            facts={[
              [t('returnRequests.fields.id'), <bdi>{request.id}</bdi>],
              [t('returnRequests.fields.status'), <ReturnRequestStatusBadge value={request.status} />],
            ]}
          />
        </Section>
        <Section title={t('returnRequests.sections.order')}>
          <Facts
            facts={[
              [
                t('returnRequests.fields.order'),
                <Link
                  className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  to={Routes.orderDetailPath(request.order.id)}
                >
                  <bdi>{request.order.orderNumber}</bdi>
                </Link>,
              ],
              [t('returnRequests.fields.orderStatus'), <bdi>{humanizeReturnRequestValue(request.order.status)}</bdi>],
            ]}
          />
        </Section>
        <Section title={t('returnRequests.sections.customer')}>
          <Facts
            facts={[
              [t('returnRequests.fields.name'), <bdi>{userName}</bdi>],
              [t('returnRequests.fields.email'), <bdi>{request.user.email}</bdi>],
            ]}
          />
        </Section>
        <Section title={t('returnRequests.sections.reason')}>
          <Facts
            facts={[
              [
                t('returnRequests.fields.reason'),
                <bdi>{returnRequestReasonLabel(request.reason, request.reasonLabel, t)}</bdi>,
              ],
              [
                t('returnRequests.fields.comment'),
                <bdi>{request.comment?.trim() ? request.comment : unavailable}</bdi>,
              ],
            ]}
          />
        </Section>
        <Section title={t('returnRequests.sections.decision')}>
          <Facts
            facts={[
              [t('returnRequests.fields.decisionNote'), <bdi>{request.decisionNote || unavailable}</bdi>],
              [t('returnRequests.fields.decidedBy'), <bdi>{adminName}</bdi>],
              [t('returnRequests.fields.adminEmail'), <bdi>{request.decidedByAdmin?.email || unavailable}</bdi>],
              [t('returnRequests.fields.decidedAt'), <bdi>{date(request.decidedAt)}</bdi>],
            ]}
          />
        </Section>
        <Section title={t('returnRequests.sections.dates')}>
          <Facts
            facts={[
              [
                t('returnRequests.fields.createdAt'),
                <time dateTime={request.createdAt}>{date(request.createdAt)}</time>,
              ],
              [
                t('returnRequests.fields.updatedAt'),
                <time dateTime={request.updatedAt}>{date(request.updatedAt)}</time>,
              ],
            ]}
          />
        </Section>
      </div>
    </>
  )
}

export default function ReturnRequestDetailPage() {
  const { id: rawId } = useParams()
  const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN
  const query = useReturnRequest(id)
  const { t } = useTranslation()
  return (
    <main className="min-w-0 space-y-4">
      <Button variant="outline" asChild>
        <Link to={Routes.returnRequests}>{t('returnRequests.back')}</Link>
      </Button>
      {!Number.isSafeInteger(id) ? (
        <p role="alert">{t('returnRequests.invalidId')}</p>
      ) : (
        <QueryStateBoundary
          isLoading={query.isLoading}
          loadingFallback={
            <div aria-hidden="true" className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-24 lg:col-span-2" />
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-56" />
              ))}
            </div>
          }
          isLoadingError={query.isError && !query.data}
          isRefetchError={query.isRefetchError}
          isPaused={query.isPaused}
          isFetching={query.isFetching}
          hasData={Boolean(query.data)}
          onRetry={query.refetch}
        >
          {query.data ? (
            <ReturnRequestContent request={query.data} refreshing={query.isFetching || query.isRefetchError} />
          ) : null}
        </QueryStateBoundary>
      )}
    </main>
  )
}
