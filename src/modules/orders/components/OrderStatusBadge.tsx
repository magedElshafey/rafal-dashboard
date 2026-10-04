import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { OrderStatusDefinition } from '../types/order.types'
import { orderStatusLabel, paymentLabel } from '../utils/order-presentation'
export function OrderStatusBadge({
  value,
  definitions = [],
  payment = false,
}: {
  value: string
  definitions?: OrderStatusDefinition[]
  payment?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline">
      <bdi>{payment ? paymentLabel(value, t) : orderStatusLabel(value, definitions, t)}</bdi>
    </Badge>
  )
}
