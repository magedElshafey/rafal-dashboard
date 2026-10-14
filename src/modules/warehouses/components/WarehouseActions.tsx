import { Boxes, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Routes } from '@/routes/routes'

import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import type { WarehouseListItem } from '@/modules/warehouses/types/warehouse.types'

type Props = {
  warehouse: WarehouseListItem
  onEdit: (warehouse: WarehouseListItem) => void
  onDelete: (warehouse: WarehouseListItem) => void
  disabled?: boolean
}

export function WarehouseActions({ warehouse, onEdit, onDelete, disabled = false }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <DashboardCardActions
      disabled={disabled}
      triggerMode="menu"
      triggerLabel={t('warehouses.actions.forWarehouse', { name: warehouse.name })}
      actions={[
        {
          id: 'inventory',
          label: t('inventory.warehouseAction'),
          accessibleLabel: t('inventory.warehouseActionNamed', { name: warehouse.name }),
          icon: Boxes,
          onClick: () => navigate(Routes.warehouseInventoryPath(warehouse.id)),
        },
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
