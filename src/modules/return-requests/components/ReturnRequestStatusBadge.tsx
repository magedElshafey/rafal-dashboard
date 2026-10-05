import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { returnRequestStatusLabel } from '../utils/return-request-presentation'

export function ReturnRequestStatusBadge({ value }: { value: string }) {
  const { t } = useTranslation()
  const variant = value === 'approved' ? 'success' : value === 'pending' ? 'warning' : 'outline'
  return (
    <Badge variant={variant}>
      <bdi>{returnRequestStatusLabel(value, t)}</bdi>
    </Badge>
  )
}
