import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Coupon } from '@/modules/coupons/types/coupon.types'

type Props = {
  coupon: Coupon
  name: string
  onEdit: (coupon: Coupon) => void
  onDelete: (coupon: Coupon) => void
  disabled?: boolean
}

export function CouponActions({ coupon, name, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('coupons.actions.forCoupon', { name })}
      actions={[
        {
          id: 'edit',
          label: t('coupons.actions.edit'),
          accessibleLabel: t('coupons.actions.editNamed', { name }),
          icon: Pencil,
          onClick: () => onEdit(coupon),
        },
        {
          id: 'delete',
          label: t('coupons.actions.delete'),
          accessibleLabel: t('coupons.actions.deleteNamed', { name }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(coupon),
        },
      ]}
    />
  )
}
