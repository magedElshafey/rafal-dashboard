import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { ShippingMethod } from '@/modules/shipping-methods/types/shipping-method.types'

type Props = {
  shippingMethod: ShippingMethod
  name: string
  onEdit: (shippingMethod: ShippingMethod) => void
  onDelete: (shippingMethod: ShippingMethod) => void
  disabled?: boolean
}

export function ShippingMethodActions({ shippingMethod, name, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('shippingMethods.actions.forMethod', { name })}
      actions={[
        {
          id: 'edit',
          label: t('shippingMethods.actions.edit'),
          accessibleLabel: t('shippingMethods.actions.editNamed', { name }),
          icon: Pencil,
          onClick: () => onEdit(shippingMethod),
        },
        {
          id: 'delete',
          label: t('shippingMethods.actions.delete'),
          accessibleLabel: t('shippingMethods.actions.deleteNamed', { name }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(shippingMethod),
        },
      ]}
    />
  )
}
