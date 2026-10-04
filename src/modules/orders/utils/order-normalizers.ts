import { rawOrderDetailSchema, rawOrderListItemSchema, rawOrderStatusSchema } from '../schemas/order.schema'
import type {
  OrderDetail,
  OrderListItem,
  OrderStatusDefinition,
  RawOrderDetail,
  RawOrderListItem,
} from '../types/order.types'

function identity(raw: RawOrderListItem | RawOrderDetail) {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    displayNumber: raw.display_number,
    status: raw.status,
    customer: raw.customer,
    warehouse: raw.warehouse,
    placedAt: raw.placed_at,
  }
}
export function normalizeOrderListItem(value: unknown): OrderListItem {
  const raw = rawOrderListItemSchema.parse(value)
  return {
    ...identity(raw),
    itemsCount: raw.items_count,
    total: raw.total,
    currency: raw.currency,
    paymentStatus: raw.payment_status,
    isGift: raw.is_gift === true || raw.is_gift === 1,
  }
}
export function normalizeOrderStatus(value: unknown): OrderStatusDefinition {
  const raw = rawOrderStatusSchema.parse(value)
  return { value: raw.value, label: raw.label, customerStatus: raw.customer_status }
}
export function normalizeOrderDetail(value: unknown): OrderDetail {
  const raw = rawOrderDetailSchema.parse(value)
  const address = raw.shipping_address
  const money = raw.money
  const gift = raw.gift
  return {
    ...identity(raw),
    shippingAddress: address
      ? {
          recipientName: address.recipient_name,
          recipientPhone: address.recipient_phone,
          city: address.city,
          district: address.district,
          streetDetails: address.street_details,
        }
      : null,
    items: raw.items.map((item) => ({
      id: item.id,
      productName: item.product_name,
      variantSku: item.variant_sku,
      variantAttributes: item.variant_attributes,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountAmount: item.discount_amount,
      lineTotal: item.line_total,
      personalization: item.personalization,
    })),
    money: {
      subtotal: money.subtotal,
      discountTotal: money.discount_total,
      shippingFee: money.shipping_fee,
      personalizationTotal: money.personalization_total,
      giftWrapFee: money.gift_wrap_fee,
      taxableAmount: money.taxable_amount,
      vat: money.vat,
      total: money.total,
      currency: money.currency,
    },
    coupon: raw.coupon,
    payment: {
      method: raw.payment.method,
      status: raw.payment.status,
      reference: raw.payment.reference,
      paidAt: raw.payment.paid_at,
    },
    statusHistory: raw.status_history.map((entry) => ({
      fromStatus: entry.from_status,
      toStatus: entry.to_status,
      note: entry.note,
      actorType: entry.actor_type,
      actorId: entry.actor_id,
      actorName: entry.actor_name,
      createdAt: entry.created_at,
    })),
    allowedTransitions: [...new Set(raw.allowed_transitions)],
    cancelledAt: raw.cancelled_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    gift: gift
      ? {
          isAnonymous: gift.is_anonymous === true || gift.is_anonymous === 1,
          message: gift.message,
          wrap: gift.wrap === true || gift.wrap === 1,
          wrapFee: gift.wrap_fee,
          buyer: gift.buyer,
          recipient: {
            name: gift.recipient.name,
            phone: gift.recipient.phone,
            city: gift.recipient.city,
            district: gift.recipient.district,
            streetDetails: gift.recipient.street_details,
          },
        }
      : null,
  }
}
