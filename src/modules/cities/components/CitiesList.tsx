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
import type { City } from '@/modules/cities/types/city.types'
import { getLocalizedName, getLogicalBoundaryPointCount } from '@/modules/cities/utils/city.utils'
import { CityActions } from './CityActions'

type Props = {
  cities: readonly City[]
  onEdit: (city: City) => void
  onDelete: (city: City) => void
  actionsDisabled?: boolean
}

export function CitiesList({ cities, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const columns = [
    { id: 'city', header: t('cities.fields.city') },
    { id: 'region', header: t('cities.fields.region') },
    { id: 'boundary', header: t('cities.fields.boundary'), className: 'w-40' },
    { id: 'sortOrder', header: t('cities.fields.sortOrder'), className: 'w-28' },
    { id: 'status', header: t('cities.fields.status'), className: 'w-28' },
    { id: 'actions', header: t('cities.actions.label'), className: 'w-20' },
  ]
  const status = (city: City) => (
    <Badge variant={city.is_active ? 'success' : 'outline'}>
      {t(city.is_active ? 'cities.status.active' : 'cities.status.inactive')}
    </Badge>
  )
  const boundary = (city: City) => {
    const count = getLogicalBoundaryPointCount(city.boundary)
    return count > 0 ? t('cities.boundary.defined', { count }) : t('cities.boundary.none')
  }

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {cities.map((city) => {
            const name = getLocalizedName(city.name, i18n.language)
            return (
              <ResponsiveDataTableRow key={city.id}>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium">
                  <bdi className="break-words">{getLocalizedName(city.name, i18n.language)}</bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal">
                  <bdi className="break-words">{getLocalizedName(city.region.name, i18n.language)}</bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{boundary(city)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{city.sort_order}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(city)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <CityActions city={city} name={name} onEdit={onEdit} onDelete={onDelete} disabled={actionsDisabled} />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {cities.map((city) => (
          <ResponsiveDataMobileCard
            key={city.id}
            title={getLocalizedName(city.name, i18n.language)}
            actions={
              <CityActions
                city={city}
                name={getLocalizedName(city.name, i18n.language)}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={actionsDisabled}
              />
            }
            facts={
              <>
                <ResponsiveDataFact label={t('cities.fields.region')}>
                  {getLocalizedName(city.region.name, i18n.language)}
                </ResponsiveDataFact>
                <ResponsiveDataFact label={t('cities.fields.boundary')}>{boundary(city)}</ResponsiveDataFact>
                <ResponsiveDataFact label={t('cities.fields.sortOrder')}>{city.sort_order}</ResponsiveDataFact>
                <ResponsiveDataFact label={t('cities.fields.status')}>{status(city)}</ResponsiveDataFact>
              </>
            }
          />
        ))}
      </ResponsiveDataMobileCards>
    </>
  )
}
