import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Admin } from '@/modules/admins/types/admin.types'

type AdminActionsProps = {
  admin: Admin
  onEdit: (admin: Admin) => void
  onDelete: (admin: Admin) => void
  disabled?: boolean
}

export function AdminActions({ admin, onEdit, onDelete, disabled = false }: AdminActionsProps) {
  const { t } = useTranslation()
  const actions = [
    {
      id: 'edit',
      label: t('admins.actions.edit'),
      accessibleLabel: t('admins.actions.editNamed', { name: admin.name }),
      icon: Pencil,
      onClick: () => onEdit(admin),
    },
    {
      id: 'delete',
      label: t('admins.actions.delete'),
      accessibleLabel: t('admins.actions.deleteNamed', { name: admin.name }),
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => onDelete(admin),
    },
  ]

  return (
    <DashboardCardActions
      actions={actions}
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('admins.actions.forAdmin', { name: admin.name })}
    />
  )
}
