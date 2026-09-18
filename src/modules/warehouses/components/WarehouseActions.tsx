import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'

type Props = {
  warehouse: Warehouse
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouse: Warehouse) => void
  disabled?: boolean
}

export function WarehouseActions({ warehouse, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('warehouses.actions.forWarehouse', { name: warehouse.name })}
      actions={[
        {
          id: 'edit',
          label: t('warehouses.actions.edit'),
          accessibleLabel: t('warehouses.actions.editNamed', { name: warehouse.name }),
          icon: Pencil,
          onClick: () => onEdit(warehouse),
        },
        {
          id: 'delete',
          label: t('warehouses.actions.delete'),
          accessibleLabel: t('warehouses.actions.deleteNamed', { name: warehouse.name }),
          icon: Trash2,
          variant: 'destructive',
          onClick: () => onDelete(warehouse),
        },
      ]}
    />
  )
}
