import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Category } from '@/modules/categories/types/category.types'

type CategoryActionsProps = {
  category: Category
  displayName: string
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  disabled?: boolean
}

export function CategoryActions({ category, displayName, onEdit, onDelete, disabled = false }: CategoryActionsProps) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('categories.actions.forCategory', { name: displayName })}
      actions={[
        {
          id: 'edit',
          label: t('categories.actions.edit'),
          accessibleLabel: t('categories.actions.editNamed', { name: displayName }),
          icon: Pencil,
          onClick: () => onEdit(category),
        },
        {
          id: 'delete',
          label: t('categories.actions.delete'),
          accessibleLabel: t('categories.actions.deleteNamed', { name: displayName }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(category),
        },
      ]}
    />
  )
}
