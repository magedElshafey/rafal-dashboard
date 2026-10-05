import { rawReturnRequestSchema } from '../schemas/return-request.schema'
import type { ReturnRequest } from '../types/return-request.types'

export function normalizeReturnRequest(value: unknown): ReturnRequest {
  const raw = rawReturnRequestSchema.parse(value)
  return {
    id: raw.id,
    order: { id: raw.order.id, orderNumber: raw.order.order_number, status: raw.order.status },
    user: raw.user,
    status: raw.status,
    reason: raw.reason,
    reasonLabel: raw.reason_label,
    comment: raw.comment,
    decisionNote: raw.decision_note,
    decidedByAdmin: raw.decided_by_admin,
    decidedAt: raw.decided_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}
