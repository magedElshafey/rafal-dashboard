import { useMemo } from 'react'
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
import { ShippingMethodActions } from '@/modules/shipping-methods/components/ShippingMethodActions'
import type { ShippingMethod } from '@/modules/shipping-methods/types/shipping-method.types'
import { getLocalizedShippingMethodValue } from '@/modules/shipping-methods/utils/shipping-method.utils'

type Props = {
  shippingMethods: readonly ShippingMethod[]
  onEdit: (shippingMethod: ShippingMethod) => void
  onDelete: (shippingMethod: ShippingMethod) => void
  actionsDisabled?: boolean
}

export function ShippingMethodsList({ shippingMethods, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar' : 'en', { maximumFractionDigits: 20 }),
    [i18n.language]
  )
  const columns = [
    { id: 'method', header: t('shippingMethods.fields.method') },
    { id: 'code', header: t('shippingMethods.fields.code'), className: 'w-32' },
    { id: 'eta', header: t('shippingMethods.fields.eta'), className: 'w-52' },
    { id: 'price', header: t('shippingMethods.fields.price'), className: 'w-28' },
    { id: 'type', header: t('shippingMethods.fields.type'), className: 'w-28' },
    { id: 'sortOrder', header: t('shippingMethods.fields.sortOrder'), className: 'w-28' },
    { id: 'status', header: t('shippingMethods.fields.status'), className: 'w-28' },
    { id: 'actions', header: t('shippingMethods.actions.label'), className: 'w-20' },
  ]
  const status = (method: ShippingMethod) => (
    <Badge variant={method.isActive ? 'success' : 'outline'}>
      {t(method.isActive ? 'shippingMethods.status.active' : 'shippingMethods.status.inactive')}
    </Badge>
  )
  const type = (method: ShippingMethod) => (
    <Badge variant={method.isPickup ? 'secondary' : 'outline'}>
      {t(method.isPickup ? 'shippingMethods.types.pickup' : 'shippingMethods.types.shipping')}
    </Badge>
  )

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {shippingMethods.map((method) => {
            const name = getLocalizedShippingMethodValue(method.name, i18n.language)
            const eta = getLocalizedShippingMethodValue(method.etaLabel, i18n.language)
            return (
              <ResponsiveDataTableRow key={method.id}>
                <ResponsiveDataTableCell className="max-w-60 whitespace-normal font-medium">
                  <bdi dir="auto" className="break-words">
                    {name}
                  </bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Badge variant="outline">{method.code}</Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-52 whitespace-normal">
                  <bdi dir="auto" className="break-words">
                    {eta}
                  </bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(method.price)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{type(method)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{method.sortOrder}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(method)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <ShippingMethodActions
                    shippingMethod={method}
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
        {shippingMethods.map((method) => {
          const name = getLocalizedShippingMethodValue(method.name, i18n.language)
          const eta = getLocalizedShippingMethodValue(method.etaLabel, i18n.language)
          return (
            <ResponsiveDataMobileCard
              key={method.id}
              title={name}
              subtitle={method.code}
              actions={
                <ShippingMethodActions
                  shippingMethod={method}
                  name={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('shippingMethods.fields.eta')}>
                    <bdi dir="auto">{eta}</bdi>
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('shippingMethods.fields.price')}>
                    {numberFormatter.format(method.price)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('shippingMethods.fields.type')}>{type(method)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('shippingMethods.fields.sortOrder')}>
                    {method.sortOrder}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('shippingMethods.fields.status')}>{status(method)}</ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
