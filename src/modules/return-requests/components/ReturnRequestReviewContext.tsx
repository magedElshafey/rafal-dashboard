import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/modules/orders/components/OrderStatusBadge'
import { Routes } from '@/routes/routes'
import type { ReturnRequest } from '../types/return-request.types'
import { returnRequestIdentityLabel, returnRequestReasonLabel } from '../utils/return-request-presentation'
import { ReturnRequestDetailsFacts, ReturnRequestDetailsSection } from './ReturnRequestDetailsSection'

export function ReturnRequestReason({ request }: { request?: ReturnRequest }) {
  const { t } = useTranslation()
  return (
    <ReturnRequestDetailsSection title={t('returnRequests.sections.reason')} className="lg:col-span-8">
      <div className="min-h-40 space-y-5">
        <div className="text-2xl font-semibold [overflow-wrap:anywhere]">
          {request ? (
            <bdi>{returnRequestReasonLabel(request.reason, request.reasonLabel, t)}</bdi>
          ) : (
            <Skeleton className="h-8 w-48 max-w-full" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t('returnRequests.fields.comment')}</p>
          {request ? (
            <p className="whitespace-pre-wrap leading-relaxed [overflow-wrap:anywhere]">
              <bdi>{request.comment?.trim() ? request.comment : t('returnRequests.unavailable')}</bdi>
            </p>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          )}
        </div>
      </div>
    </ReturnRequestDetailsSection>
  )
}

export function ReturnRequestRelationships({ request }: { request?: ReturnRequest }) {
  const { t } = useTranslation()
  const customerName = request?.user.name.trim()
  const customerIdentity = request
    ? returnRequestIdentityLabel(
        request.user.name,
        request.user.email,
        t('returnRequests.workspace.customerFallback', { id: request.user.id })
      )
    : ''
  const customerFacts: [string, string][] = [[t('returnRequests.fields.email'), request?.user.email.trim() || '—']]
  if (!request || customerName) customerFacts.unshift([t('returnRequests.fields.name'), customerName || ''])
  return (
    <div className="grid min-w-0 gap-5 md:grid-cols-2 lg:col-span-12">
      <ReturnRequestDetailsSection title={t('returnRequests.sections.order')}>
        <ReturnRequestDetailsFacts
          loading={!request}
          facts={[
            [t('returnRequests.fields.order'), request?.order.orderNumber],
            [
              t('returnRequests.fields.orderStatus'),
              request ? <OrderStatusBadge value={request.order.status} /> : null,
            ],
          ]}
        />
        {request ? (
          <Button variant="outline" asChild>
            <Link
              className="max-w-full whitespace-normal"
              to={Routes.orderDetailPath(request.order.id)}
              aria-label={t('returnRequests.workspace.viewOrderNamed', { number: request.order.orderNumber })}
            >
              {t('returnRequests.workspace.viewOrder')}
            </Link>
          </Button>
        ) : (
          <Skeleton className="h-9 w-40 max-w-full" />
        )}
      </ReturnRequestDetailsSection>
      <ReturnRequestDetailsSection title={t('returnRequests.sections.customer')}>
        <ReturnRequestDetailsFacts loading={!request} facts={customerFacts} />
        {request ? (
          <Button variant="outline" asChild>
            <Link
              className="max-w-full whitespace-normal"
              to={Routes.customerDetailPath(request.user.id)}
              aria-label={t('returnRequests.workspace.viewCustomerNamed', { name: customerIdentity })}
            >
              {t('returnRequests.workspace.viewCustomer')}
            </Link>
          </Button>
        ) : (
          <Skeleton className="h-9 w-40 max-w-full" />
        )}
      </ReturnRequestDetailsSection>
    </div>
  )
}
