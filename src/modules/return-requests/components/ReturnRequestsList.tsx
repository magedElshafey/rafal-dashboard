import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import { Skeleton } from '@/components/ui/skeleton'
import { Routes } from '@/routes/routes'
import { formatDateTime } from '@/utils/date/date.helpers'
import type { ReturnRequest } from '../types/return-request.types'
import { returnRequestIdentityLabel, returnRequestReasonLabel } from '../utils/return-request-presentation'
import { ReturnRequestStatusBadge } from './ReturnRequestStatusBadge'

const fields = ['id', 'order', 'user', 'status', 'reason', 'comment', 'createdAt', 'actions'] as const

function Comment({ value }: { value: string | null }) {
  const { t } = useTranslation()
  const comment = value?.trim() ? value : null
  return (
    <span className="block whitespace-normal break-words lg:line-clamp-2 lg:max-w-64" title={comment ?? undefined}>
      <bdi>{comment ?? t('returnRequests.unavailable')}</bdi>
    </span>
  )
}

export function ReturnRequestsList({ requests }: { requests: ReturnRequest[] }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const unavailable = t('returnRequests.unavailable')
  const date = (value: string) =>
    formatDateTime(value, { locale: i18n.language.startsWith('ar') ? 'ar' : 'en' }) || unavailable
  const columns = fields.map((id) => ({ id, header: t(`returnRequests.fields.${id}`) }))
  const values = (request: ReturnRequest) => [
    <bdi>{request.id}</bdi>,
    <bdi>{request.order.orderNumber}</bdi>,
    <bdi>{returnRequestIdentityLabel(request.user.name, request.user.email, unavailable)}</bdi>,
    <ReturnRequestStatusBadge value={request.status} />,
    <bdi>{returnRequestReasonLabel(request.reason, request.reasonLabel, t)}</bdi>,
    <Comment value={request.comment} />,
    <time dateTime={request.createdAt}>{date(request.createdAt)}</time>,
  ]
  const action = (request: ReturnRequest) => (
    <DashboardCardActions
      actions={[
        {
          id: 'view',
          label: t('returnRequests.view'),
          accessibleLabel: t('returnRequests.viewNamed', { id: request.id }),
          icon: Eye,
          onClick: () => navigate(Routes.returnRequestDetailPath(request.id)),
        },
      ]}
    />
  )
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {requests.map((request) => (
            <ResponsiveDataTableRow key={request.id}>
              {values(request).map((value, index) => (
                <ResponsiveDataTableCell key={fields[index]}>{value}</ResponsiveDataTableCell>
              ))}
              <ResponsiveDataTableCell>{action(request)}</ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {requests.map((request) => (
          <ResponsiveDataMobileCard
            key={request.id}
            title={<bdi>{t('returnRequests.requestTitle', { id: request.id })}</bdi>}
            subtitle={<bdi>{request.order.orderNumber}</bdi>}
            actions={action(request)}
            facts={values(request)
              .slice(2)
              .map((value, index) => (
                <ResponsiveDataFact key={fields[index + 2]} label={t(`returnRequests.fields.${fields[index + 2]}`)}>
                  {value}
                </ResponsiveDataFact>
              ))}
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}

export function ReturnRequestsListSkeleton() {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true">
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={fields.map((id) => ({ id, header: t(`returnRequests.fields.${id}`) }))}>
          {Array.from({ length: 5 }, (_, row) => (
            <ResponsiveDataTableRow key={row}>
              {fields.map((field) => (
                <ResponsiveDataTableCell key={field}>
                  <Skeleton className="h-6 w-20" />
                </ResponsiveDataTableCell>
              ))}
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {Array.from({ length: 3 }, (_, row) => (
          <Skeleton key={row} className="h-72 w-full" />
        ))}
      </ResponsiveDataMobileCards>
    </div>
  )
}
