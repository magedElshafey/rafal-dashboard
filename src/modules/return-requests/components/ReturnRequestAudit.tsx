import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { ReturnRequest } from '../types/return-request.types'
import {
  isReturnRequestDecided,
  returnRequestIdentityLabel,
  returnRequestStatusLabel,
} from '../utils/return-request-presentation'
import { ReturnRequestDetailsFacts, ReturnRequestDetailsSection } from './ReturnRequestDetailsSection'

export function ReturnRequestAudit({ request }: { request?: ReturnRequest }) {
  const { t, i18n } = useTranslation()
  const date = (value?: string | null) => formatDateTime(value, { locale: resolveAppLocale(i18n.language) }) || '—'
  const admin = request?.decidedByAdmin
  const decided = isReturnRequestDecided(request?.status)
  return (
    <>
      <ReturnRequestDetailsSection title={t('returnRequests.workspace.lifecycle')} className="lg:col-span-12">
        <ol className="grid gap-6 sm:grid-cols-2">
          <li className="space-y-2 border-s-2 border-border ps-4">
            <p className="font-medium">{t('returnRequests.workspace.submitted')}</p>
            {request ? (
              <time className="text-sm text-muted-foreground" dateTime={request.createdAt}>
                {date(request.createdAt)}
              </time>
            ) : (
              <Skeleton className="h-5 w-40 max-w-full" />
            )}
          </li>
          <li className="space-y-2 border-s-2 border-border ps-4">
            <p className="font-medium">
              {t(
                !request || request.status === 'pending' || decided
                  ? 'returnRequests.fields.decision'
                  : 'returnRequests.workspace.currentStatus'
              )}
            </p>
            {!request ? (
              <Skeleton className="h-5 w-40 max-w-full" />
            ) : request.status === 'pending' ? (
              <p className="text-sm text-muted-foreground">{t('returnRequests.workspace.awaitingDecision')}</p>
            ) : decided ? (
              <div className="space-y-1 text-sm [overflow-wrap:anywhere]">
                <p>{returnRequestStatusLabel(request.status, t)}</p>
                <time className="block text-muted-foreground" dateTime={request.decidedAt ?? undefined}>
                  {date(request.decidedAt)}
                </time>
                {admin ? (
                  <p>
                    <bdi>
                      {returnRequestIdentityLabel(
                        admin.name,
                        admin.email,
                        t('returnRequests.workspace.adminFallback', { id: admin.id })
                      )}
                    </bdi>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm [overflow-wrap:anywhere]">{returnRequestStatusLabel(request.status, t)}</p>
            )}
          </li>
        </ol>
      </ReturnRequestDetailsSection>
      <ReturnRequestDetailsSection title={t('returnRequests.workspace.metadata')} className="lg:col-span-12">
        <ReturnRequestDetailsFacts
          loading={!request}
          facts={[
            [
              t('returnRequests.fields.createdAt'),
              <time dateTime={request?.createdAt}>{date(request?.createdAt)}</time>,
            ],
            [
              t('returnRequests.fields.updatedAt'),
              <time dateTime={request?.updatedAt}>{date(request?.updatedAt)}</time>,
            ],
          ]}
        />
      </ReturnRequestDetailsSection>
    </>
  )
}
