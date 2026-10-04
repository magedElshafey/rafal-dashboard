import type { TFunction } from 'i18next'
import type { OrderListItem, OrderStatusDefinition } from '../types/order.types'

const statusKeys: Record<string, string> = {
  new: 'new',
  confirmed: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  returned: 'returned',
  cancelled: 'cancelled',
  payment_failed: 'paymentFailed',
  pending_verification: 'pendingVerification',
}
export const humanizeOrderValue = (value: string) => value.replace(/_/g, ' ')
export function orderStatusLabel(value: string, definitions: OrderStatusDefinition[], t: TFunction) {
  const key = Object.prototype.hasOwnProperty.call(statusKeys, value) ? statusKeys[value] : undefined
  return key
    ? t(`orders.status.${key}`)
    : definitions.find((item) => item.value === value)?.label || humanizeOrderValue(value)
}
export function paymentLabel(value: string, t: TFunction) {
  return value === 'paid' || value === 'pending' ? t(`orders.paymentStatus.${value}`) : humanizeOrderValue(value)
}
export function customerLabel(customer: OrderListItem['customer'], unavailable: string) {
  return [customer.name, customer.email, customer.phone].find((value) => value.trim()) || unavailable
}
// No shared currency formatter exists. Keep backend decimal precision; never recalculate amounts.
export function orderMoneyLabel(value: string, currency: string, language: string) {
  const [integer, fraction] = value.split('.')
  const locale = language.startsWith('ar') ? 'ar' : 'en'
  const parts = new Intl.NumberFormat(locale).formatToParts(1.1)
  const separator = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const digits = new Intl.NumberFormat(locale, { useGrouping: false })
  const fractional = fraction ? separator + [...fraction].map((digit) => digits.format(Number(digit))).join('') : ''
  return `${new Intl.NumberFormat(locale).format(BigInt(integer))}${fractional} ${currency}`
}
