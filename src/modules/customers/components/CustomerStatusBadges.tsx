import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { getReadableStatus } from '@/modules/customers/utils/customer.utils'

const knownOrderStatuses = new Set(['processing', 'delivered', 'cancelled'])
const knownPaymentStatuses = new Set(['pending', 'paid', 'cancelled'])

export function CustomerStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const isKnown = status === 'active'
  return (
    <Badge variant={isKnown ? 'success' : 'outline'}>
      {isKnown ? t('customers.status.customer.active') : getReadableStatus(status)}
    </Badge>
  )
}

export function CustomerAccessBadge({ isBlocked }: { isBlocked: boolean }) {
  const { t } = useTranslation()
  return (
    <Badge variant={isBlocked ? 'error' : 'success'}>
      {t(isBlocked ? 'customers.status.access.blocked' : 'customers.status.access.allowed')}
    </Badge>
  )
}

export function CustomerOrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const isKnown = knownOrderStatuses.has(status)
  const variant = status === 'delivered' ? 'success' : status === 'cancelled' ? 'error' : 'secondary'
  return (
    <Badge variant={isKnown ? variant : 'outline'}>
      {isKnown ? t(`customers.status.order.${status}`) : getReadableStatus(status)}
    </Badge>
  )
}

export function CustomerPaymentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const isKnown = knownPaymentStatuses.has(status)
  const variant = status === 'paid' ? 'success' : status === 'cancelled' ? 'error' : 'warning'
  return (
    <Badge variant={isKnown ? variant : 'outline'}>
      {isKnown ? t(`customers.status.payment.${status}`) : getReadableStatus(status)}
    </Badge>
  )
}
