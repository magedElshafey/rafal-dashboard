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
import { RegionActions } from './RegionActions'
import type { Region } from '@/modules/regions/types/region.types'
import { getLocalizedRegionName } from '@/modules/regions/utils/region.utils'

type Props = {
  regions: readonly Region[]
  onEdit: (region: Region) => void
  onDelete: (region: Region) => void
  actionsDisabled?: boolean
}

export function RegionsList({ regions, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const columns = [
    { id: 'name', header: t('regions.fields.name') },
    { id: 'code', header: t('regions.fields.code'), className: 'w-28' },
    { id: 'cities', header: t('regions.fields.cities'), className: 'w-32' },
    { id: 'sortOrder', header: t('regions.fields.sortOrder'), className: 'w-28' },
    { id: 'status', header: t('regions.fields.status'), className: 'w-32' },
    { id: 'actions', header: t('regions.actions.label'), className: 'w-20' },
  ]
  const status = (region: Region) => (
    <Badge variant={region.is_active ? 'success' : 'outline'}>
      {t(region.is_active ? 'regions.status.active' : 'regions.status.inactive')}
    </Badge>
  )
  const code = (region: Region) =>
    region.code ? <Badge variant="outline">{region.code}</Badge> : <span className="text-muted-foreground">—</span>

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {regions.map((region) => {
            const name = getLocalizedRegionName(region.name, i18n.language)
            return (
              <ResponsiveDataTableRow key={region.id}>
                <ResponsiveDataTableCell className="max-w-72 whitespace-normal font-medium">
                  <bdi className="break-words" dir="auto">
                    {name}
                  </bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{code(region)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  {t('regions.citiesCount', { count: region.cities_count })}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{region.sort_order}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(region)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <RegionActions
                    region={region}
                    name={name}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={actionsDisabled}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {regions.map((region) => {
          const name = getLocalizedRegionName(region.name, i18n.language)
          return (
            <ResponsiveDataMobileCard
              key={region.id}
              title={name}
              actions={
                <RegionActions
                  region={region}
                  name={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('regions.fields.code')}>{code(region)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('regions.fields.cities')}>
                    {t('regions.citiesCount', { count: region.cities_count })}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('regions.fields.sortOrder')}>{region.sort_order}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('regions.fields.status')}>{status(region)}</ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
