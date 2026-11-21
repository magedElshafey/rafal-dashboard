import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/shared/dashboard/atoms/StatusBadge'
import type { AffiliateStatus } from '@/modules/affiliates/types/affiliate.types'

export function AffiliateStatusBadge({ status }: { status: AffiliateStatus }) {
  const { t } = useTranslation()
  return (
    <StatusBadge variant={status === 'active' ? 'success' : 'warning'}>{t(`affiliates.status.${status}`)}</StatusBadge>
  )
}
