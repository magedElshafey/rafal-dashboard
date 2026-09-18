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
import { CoverageZoneSummary } from './CoverageZoneSummary'
import { WarehouseActions } from './WarehouseActions'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'

type Props = {
  warehouses: readonly Warehouse[]
  onEdit: (warehouse: Warehouse) => void
  onDelete: (warehouse: Warehouse) => void
  actionsDisabled?: boolean
}

export function WarehousesList({ warehouses, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t } = useTranslation()
  const columns = [
    { id: 'name', header: t('warehouses.fields.name') },
    { id: 'coverage', header: t('warehouses.fields.coverageZones') },
    { id: 'status', header: t('warehouses.fields.status'), className: 'w-32' },
    { id: 'actions', header: t('warehouses.actions.label'), className: 'w-20' },
  ]
  const status = (warehouse: Warehouse) => (
    <Badge variant={warehouse.is_active ? 'success' : 'outline'}>
      {t(warehouse.is_active ? 'warehouses.status.active' : 'warehouses.status.inactive')}
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
              <ResponsiveDataTableCell className="max-w-80 whitespace-normal">
                <CoverageZoneSummary zones={warehouse.coverage_zone} />
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
                <ResponsiveDataFact label={t('warehouses.fields.coverageZones')}>
                  <CoverageZoneSummary zones={warehouse.coverage_zone} />
                </ResponsiveDataFact>
              </>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
