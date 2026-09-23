import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { ProductListItem } from '@/modules/products/types/product.types'

type Props = {
  product: ProductListItem
  displayName: string
  onEdit: (product: ProductListItem) => void
  onDelete: (product: ProductListItem) => void
  disabled?: boolean
}

export function ProductActions({ product, displayName, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('products.actions.forProduct', { name: displayName })}
      actions={[
        {
          id: 'edit',
          label: t('products.actions.edit'),
          accessibleLabel: t('products.actions.editNamed', { name: displayName }),
          icon: Pencil,
          onClick: () => onEdit(product),
        },
        {
          id: 'delete',
          label: t('products.actions.delete'),
          accessibleLabel: t('products.actions.deleteNamed', { name: displayName }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(product),
        },
      ]}
    />
  )
}
