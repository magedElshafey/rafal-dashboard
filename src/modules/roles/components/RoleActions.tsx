import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Role } from '@/modules/roles/types/role.types'

type RoleActionsProps = {
  role: Role
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  disabled?: boolean
}

export function RoleActions({ role, onEdit, onDelete, disabled = false }: RoleActionsProps) {
  const { t } = useTranslation()
  const actions = [
    {
      id: 'edit',
      label: t('roles.actions.edit'),
      accessibleLabel: t('roles.actions.editNamed', { name: role.name }),
      icon: Pencil,
      onClick: () => onEdit(role),
    },
    {
      id: 'delete',
      label: t('roles.actions.delete'),
      accessibleLabel: t('roles.actions.deleteNamed', { name: role.name }),
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => onDelete(role),
    },
  ]

  return (
    <DashboardCardActions
      actions={actions}
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('roles.actions.forRole', { name: role.name })}
    />
  )
}
