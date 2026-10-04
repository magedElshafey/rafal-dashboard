import type { z } from 'zod'
import type {
  rawOrderDetailSchema,
  rawOrderGiftSchema,
  rawOrderListItemSchema,
  rawOrderStatusSchema,
  successEnvelopeSchema,
  failureEnvelopeSchema,
} from '../schemas/order.schema'

export type RawOrderListItem = z.infer<typeof rawOrderListItemSchema>
export type RawOrderDetail = z.infer<typeof rawOrderDetailSchema>
export type RawOrderGift = z.infer<typeof rawOrderGiftSchema>
export type RawOrderStatusDefinition = z.infer<typeof rawOrderStatusSchema>
export type RawOrderStatusUpdateResponse = z.infer<typeof successEnvelopeSchema>
export type RawOrderStatusUpdateError = z.infer<typeof failureEnvelopeSchema>
export type OrderStatusDefinition = { value: string; label: string; customerStatus: string }
type OrderIdentity = {
  id: number
  orderNumber: string
  displayNumber: string
  status: string
  customer: RawOrderListItem['customer']
  warehouse: RawOrderListItem['warehouse']
  placedAt: string | null
}
export type OrderListItem = OrderIdentity & {
  itemsCount: number
  total: string
  currency: string
  paymentStatus: string
  isGift: boolean
}
export type OrderItem = {
  id: number
  productName: string
  variantSku: string
  variantAttributes: Record<string, string>
  quantity: number
  unitPrice: string
  discountAmount: string
  lineTotal: string
}
export type OrderMoney = {
  subtotal: string
  discountTotal: string
  shippingFee: string
  personalizationTotal: string
  giftWrapFee: string
  taxableAmount: string
  vat: { rate: string; amount: string }
  total: string
  currency: string
}
export type OrderGift = {
  isAnonymous: boolean
  message: string | null
  wrap: boolean
  wrapFee: string
  buyer: { type: string; name: string; email: string; phone: string }
  recipient: {
    name: string
    phone: string
    city: { id: number; name: string } | null
    district: string
    streetDetails: string
  }
}
export type OrderDetail = OrderIdentity & {
  shippingAddress: {
    recipientName: string
    recipientPhone: string
    city: { id: number; name: string } | null
    district: string
    streetDetails: string
  } | null
  items: OrderItem[]
  money: OrderMoney
  coupon: unknown
  payment: { method: string; status: string; reference: string | null; paidAt: string | null }
  statusHistory: {
    fromStatus: string | null
    toStatus: string
    note: string | null
    actorType: string
    actorId: number | null
    actorName: string | null
    createdAt: string
  }[]
  allowedTransitions: string[]
  cancelledAt: string | null
  createdAt: string | null
  updatedAt: string | null
  gift: OrderGift | null
}
export type OrdersFilters = {
  search: string
  status: string | null
  paymentStatus: string | null
  dateFrom: string
  dateTo: string
  warehouseId: number | null
  isGift: boolean | null
  isGuest: boolean | null
}
