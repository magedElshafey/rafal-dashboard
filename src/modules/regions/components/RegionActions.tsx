import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Region } from '@/modules/regions/types/region.types'

type Props = {
  region: Region
  name: string
  onEdit: (region: Region) => void
  onDelete: (region: Region) => void
  disabled?: boolean
}

export function RegionActions({ region, name, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('regions.actions.forRegion', { name })}
      actions={[
        {
          id: 'edit',
          label: t('regions.actions.edit'),
          accessibleLabel: t('regions.actions.editNamed', { name }),
          icon: Pencil,
          onClick: () => onEdit(region),
        },
        {
          id: 'delete',
          label: t('regions.actions.delete'),
          accessibleLabel: t('regions.actions.deleteNamed', { name }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(region),
        },
      ]}
    />
  )
}
