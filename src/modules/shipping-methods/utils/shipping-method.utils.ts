import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type {
  ShippingMethod,
  ShippingMethodFormValues,
  ShippingMethodUpdatePayload,
} from '@/modules/shipping-methods/types/shipping-method.types'
import type { LocalizedName } from '@/types/localized-name.types'

export function getLocalizedShippingMethodValue(value: LocalizedName, language: string) {
  const preferred = language.startsWith('ar') ? value.ar : value.en
  return preferred.trim() || value.ar.trim() || value.en.trim() || '—'
}

export function toShippingMethodFormValues(method: ShippingMethod): ShippingMethodFormValues {
  return {
    code: method.code,
    name: { ...method.name },
    etaLabel: { ...method.etaLabel },
    price: method.price,
    isPickup: method.isPickup,
    isActive: method.isActive,
    sortOrder: method.sortOrder,
  }
}

export function buildShippingMethodUpdatePayload(
  values: ShippingMethodFormValues,
  dirty: Partial<Readonly<FieldNamesMarkedBoolean<ShippingMethodFormValues>>>
): ShippingMethodUpdatePayload {
  const payload: ShippingMethodUpdatePayload = {}
  if (dirty.code) payload.code = values.code.trim()
  if (dirty.name?.ar) payload.nameAr = values.name.ar.trim()
  if (dirty.name?.en) payload.nameEn = values.name.en.trim()
  if (dirty.etaLabel?.ar) payload.etaLabelAr = values.etaLabel.ar.trim()
  if (dirty.etaLabel?.en) payload.etaLabelEn = values.etaLabel.en.trim()
  if (dirty.price) payload.price = values.price
  if (dirty.isPickup) payload.isPickup = values.isPickup
  if (dirty.isActive) payload.isActive = values.isActive
  if (dirty.sortOrder) {
    if (values.sortOrder === null) throw new Error('A dirty Shipping Method sort order must be numeric.')
    payload.sortOrder = values.sortOrder
  }
  if (dirty.isPickup && values.isPickup) payload.price = 0
  return payload
}
