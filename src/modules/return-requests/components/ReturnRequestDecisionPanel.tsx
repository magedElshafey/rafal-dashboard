import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { ReturnRequest } from '../types/return-request.types'
import { isReturnRequestDecided, returnRequestIdentityLabel } from '../utils/return-request-presentation'
import { ReturnRequestDecisionActions } from './ReturnRequestDecisionActions'
import { ReturnRequestDetailsSection } from './ReturnRequestDetailsSection'
import { ReturnRequestStatusBadge } from './ReturnRequestStatusBadge'

export function ReturnRequestDecisionPanel({ request, disabled }: { request?: ReturnRequest; disabled: boolean }) {
  const { t, i18n } = useTranslation()
  const pending = request?.status === 'pending'
  const decided = isReturnRequestDecided(request?.status)
  const admin = request?.decidedByAdmin
  const actor = admin
    ? returnRequestIdentityLabel(admin.name, admin.email, t('returnRequests.workspace.adminFallback', { id: admin.id }))
    : '—'
  return (
    <ReturnRequestDetailsSection
      title={t(
        pending || !request
          ? 'returnRequests.workspace.reviewDecision'
          : decided
            ? 'returnRequests.workspace.decisionSummary'
            : 'returnRequests.workspace.requestStatus'
      )}
      className="lg:col-span-4"
    >
      <div className="min-h-56 space-y-5">
        {request ? <ReturnRequestStatusBadge value={request.status} /> : <Skeleton className="h-6 w-24" />}
        {!request ? (
          <>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </>
        ) : pending ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('returnRequests.workspace.reviewGuidance')}
            </p>
            {disabled ? (
              <p className="text-sm text-muted-foreground">{t('returnRequests.workspace.freshnessRequired')}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ReturnRequestDecisionActions request={request} refreshing={disabled} />
            </div>
          </>
        ) : decided ? (
          <dl className="space-y-4 [overflow-wrap:anywhere]">
            <div>
              <dt className="text-sm text-muted-foreground">{t('returnRequests.fields.decisionNote')}</dt>
              <dd className="mt-1 whitespace-pre-wrap">
                <bdi>{request.decisionNote?.trim() ? request.decisionNote : '—'}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('returnRequests.fields.decidedBy')}</dt>
              <dd className="mt-1">
                <bdi>{actor}</bdi>
                {admin?.email.trim() && admin.email.trim() !== actor ? (
                  <span className="block text-sm text-muted-foreground">
                    <bdi>{admin.email}</bdi>
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('returnRequests.fields.decidedAt')}</dt>
              <dd className="mt-1">
                <time dateTime={request.decidedAt ?? undefined}>
                  {formatDateTime(request.decidedAt, { locale: resolveAppLocale(i18n.language) }) || '—'}
                </time>
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </ReturnRequestDetailsSection>
  )
}
