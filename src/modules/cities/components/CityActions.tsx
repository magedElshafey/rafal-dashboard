import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { City } from '@/modules/cities/types/city.types'

type Props = {
  city: City
  name: string
  onEdit: (city: City) => void
  onDelete: (city: City) => void
  disabled?: boolean
}

export function CityActions({ city, name, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('cities.actions.forCity', { name })}
      actions={[
        {
          id: 'edit',
          label: t('cities.actions.edit'),
          accessibleLabel: t('cities.actions.editNamed', { name }),
          icon: Pencil,
          onClick: () => onEdit(city),
        },
        {
          id: 'delete',
          label: t('cities.actions.delete'),
          accessibleLabel: t('cities.actions.deleteNamed', { name }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(city),
        },
      ]}
    />
  )
}
