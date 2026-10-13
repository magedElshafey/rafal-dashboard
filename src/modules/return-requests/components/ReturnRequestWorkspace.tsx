import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/modules/orders/components/OrderStatusBadge'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { ReturnRequest } from '../types/return-request.types'
import { ReturnRequestAudit } from './ReturnRequestAudit'
import { ReturnRequestDecisionPanel } from './ReturnRequestDecisionPanel'
import { ReturnRequestReason, ReturnRequestRelationships } from './ReturnRequestReviewContext'
import { ReturnRequestStatusBadge } from './ReturnRequestStatusBadge'

export function ReturnRequestBackLink() {
  const { t } = useTranslation()
  return (
    <Button variant="outline" asChild>
      <Link to={Routes.returnRequests}>{t('returnRequests.back')}</Link>
    </Button>
  )
}

export function ReturnRequestWorkspace({ request, disabled = true }: { request?: ReturnRequest; disabled?: boolean }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="min-w-0 space-y-5" aria-hidden={!request || undefined}>
      <div>
        <DashboardPageHeader
          title={
            request ? (
              <bdi>{t('returnRequests.requestTitle', { id: request.id })}</bdi>
            ) : (
              <Skeleton className="h-9 w-72 max-w-full" />
            )
          }
          actions={request ? <ReturnRequestBackLink /> : <Skeleton className="h-9 w-48 max-w-full" />}
        />
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {request ? (
            <>
              <ReturnRequestStatusBadge value={request.status} />
              <span>
                {t('returnRequests.workspace.submitted')}{' '}
                <time dateTime={request.createdAt}>
                  {formatDateTime(request.createdAt, { locale: resolveAppLocale(i18n.language) }) || '—'}
                </time>
              </span>
              <bdi>{request.order.orderNumber}</bdi>
              <OrderStatusBadge value={request.order.status} />
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-32" />
            </>
          )}
        </div>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-12">
        <ReturnRequestReason request={request} />
        <ReturnRequestDecisionPanel request={request} disabled={disabled} />
        <ReturnRequestRelationships request={request} />
        <ReturnRequestAudit request={request} />
      </div>
    </div>
  )
}
