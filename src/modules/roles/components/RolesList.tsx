import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { RoleActions } from '@/modules/roles/components/RoleActions'
import { RolePermissions } from '@/modules/roles/components/RolePermissions'
import type { Role } from '@/modules/roles/types/role.types'

type RolesListProps = {
  roles: readonly Role[]
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  actionsDisabled?: boolean
}

export function RolesList({ roles, onEdit, onDelete, actionsDisabled = false }: RolesListProps) {
  const { t } = useTranslation()
  const columns = [
    { id: 'name', header: t('roles.roleName') },
    { id: 'permissions', header: t('roles.permissions') },
    { id: 'actions', header: t('roles.actions.label'), className: 'w-20' },
  ]

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {roles.map((role) => (
            <ResponsiveDataTableRow key={role.id}>
              <ResponsiveDataTableCell className="max-w-72 whitespace-normal font-medium text-foreground">
                {role.name}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-md whitespace-normal">
                <RolePermissions permissions={role.permissions} />
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <RoleActions role={role} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {roles.map((role) => (
          <ResponsiveDataMobileCard
            key={role.id}
            title={role.name}
            actions={<RoleActions role={role} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />}
            facts={
              <ResponsiveDataFact label={t('roles.permissions')}>
                <RolePermissions permissions={role.permissions} />
              </ResponsiveDataFact>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
