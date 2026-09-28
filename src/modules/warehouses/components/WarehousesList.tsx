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
import { Badge } from '@/components/ui/badge'
import { WarehouseActions } from './WarehouseActions'
import type { WarehouseListItem } from '@/modules/warehouses/types/warehouse.types'

type Props = {
  warehouses: readonly WarehouseListItem[]
  onEdit: (warehouse: WarehouseListItem) => void
  onDelete: (warehouse: WarehouseListItem) => void
  actionsDisabled?: boolean
}

export function WarehousesList({ warehouses, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t } = useTranslation()
  const columns = [
    { id: 'name', header: t('warehouses.fields.name') },
    { id: 'status', header: t('warehouses.fields.status'), className: 'w-32' },
    { id: 'actions', header: t('warehouses.actions.label'), className: 'w-20' },
  ]
  const status = (warehouse: WarehouseListItem) => (
    <Badge variant={warehouse.isActive ? 'success' : 'outline'}>
      {t(warehouse.isActive ? 'warehouses.status.active' : 'warehouses.status.inactive')}
    </Badge>
  )
  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {warehouses.map((warehouse) => (
            <ResponsiveDataTableRow key={warehouse.id}>
              <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium">
                <bdi className="break-words" dir="auto">
                  {warehouse.name}
                </bdi>
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{status(warehouse)}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                <WarehouseActions
                  warehouse={warehouse}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {warehouses.map((warehouse) => (
          <ResponsiveDataMobileCard
            key={warehouse.id}
            title={warehouse.name}
            actions={
              <WarehouseActions warehouse={warehouse} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />
            }
            facts={
              <>
                <ResponsiveDataFact label={t('warehouses.fields.status')}>{status(warehouse)}</ResponsiveDataFact>
              </>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
