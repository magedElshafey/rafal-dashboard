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
import { AdminActions } from '@/modules/admins/components/AdminActions'
import { AdminRoles } from '@/modules/admins/components/AdminRoles'
import type { Admin } from '@/modules/admins/types/admin.types'

type AdminsListProps = {
  admins: readonly Admin[]
  onEdit: (admin: Admin) => void
  onDelete: (admin: Admin) => void
  actionsDisabled?: boolean
}

export function AdminsList({ admins, onEdit, onDelete, actionsDisabled = false }: AdminsListProps) {
  const { t } = useTranslation()
  const columns = [
    { id: 'name', header: t('admins.name') },
    { id: 'email', header: t('admins.email') },
    { id: 'roles', header: t('admins.roles') },
    { id: 'actions', header: t('admins.actions.label'), className: 'w-20' },
  ]

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {admins.map((admin) => (
            <ResponsiveDataTableRow key={admin.id}>
              <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium text-foreground">
                <span className="break-words">{admin.name}</span>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-72 whitespace-normal">
                <a className="block break-all normal-case text-foreground" dir="ltr" href={`mailto:${admin.email}`}>
                  {admin.email}
                </a>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-sm whitespace-normal">
                <AdminRoles roles={admin.roles} />
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <AdminActions admin={admin} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {admins.map((admin) => (
          <ResponsiveDataMobileCard
            key={admin.id}
            title={admin.name}
            subtitle={
              <a className="normal-case" dir="ltr" href={`mailto:${admin.email}`}>
                {admin.email}
              </a>
            }
            actions={<AdminActions admin={admin} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />}
            facts={
              <ResponsiveDataFact label={t('admins.roles')}>
                <AdminRoles roles={admin.roles} />
              </ResponsiveDataFact>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
