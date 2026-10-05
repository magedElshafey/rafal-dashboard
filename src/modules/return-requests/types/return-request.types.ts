import type { z } from 'zod'
import type {
  rawReturnRequestSchema,
  returnRequestIndexEnvelopeSchema,
  returnRequestSuccessEnvelopeSchema,
} from '../schemas/return-request.schema'

export type RawReturnRequest = z.infer<typeof rawReturnRequestSchema>
export type RawReturnRequestIndexResponse = z.infer<typeof returnRequestIndexEnvelopeSchema>
export type RawReturnRequestMutationEnvelope = z.infer<typeof returnRequestSuccessEnvelopeSchema>

export type ReturnRequest = {
  id: number
  order: { id: number; orderNumber: string; status: string }
  user: { id: number; name: string; email: string }
  status: string
  reason: string
  reasonLabel: string
  comment: string | null
  decisionNote: string | null
  decidedByAdmin: { id: number; name: string; email: string } | null
  decidedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReturnRequestsIndex = {
  items: ReturnRequest[]
  meta: { currentPage: number; perPage: number }
}

export type ReturnRequestDecisionAction = 'approve' | 'reject'
export type ReturnRequestDecisionPayload = {
  action: ReturnRequestDecisionAction
  decisionNote: string
}
export type ReturnRequestDecisionResult = {
  message?: string
  detail: ReturnRequest | null
}
