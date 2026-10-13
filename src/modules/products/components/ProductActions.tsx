import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { ProductListItem } from '@/modules/products/types/product.types'
import { Routes } from '@/routes/routes'

type Props = {
  product: ProductListItem
  displayName: string
  onEdit: (product: ProductListItem) => void
  onDelete: (product: ProductListItem) => void
  disabled?: boolean
}

export function ProductActions({ product, displayName, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('products.actions.forProduct', { name: displayName })}
      actions={[
        {
          id: 'view',
          label: t('products.actions.view'),
          accessibleLabel: t('products.actions.viewNamed', { name: displayName }),
          icon: Eye,
          onClick: () => navigate(Routes.productDetailPath(product.id)),
        },
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
