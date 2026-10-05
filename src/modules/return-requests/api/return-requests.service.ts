import { z } from 'zod'
import { $http } from '@/utils/http'
import {
  returnRequestFailureEnvelopeSchema,
  returnRequestIndexEnvelopeSchema,
  returnRequestSuccessEnvelopeSchema,
} from '../schemas/return-request.schema'
import type { ReturnRequestDecisionResult, ReturnRequestsIndex } from '../types/return-request.types'
import { ReturnRequestDecisionError } from '../utils/return-request-errors'
import { normalizeReturnRequest } from '../utils/return-request-normalizers'

const validId = z.number().int().positive().safe()

function decisionFailure(value: unknown) {
  const parsed = returnRequestFailureEnvelopeSchema.safeParse(value)
  if (parsed.success && parsed.data.success === false) throw new ReturnRequestDecisionError(parsed.data)
}

function message(value: string | undefined) {
  return value?.trim() || undefined
}

export const returnRequestsService = {
  async list(signal?: AbortSignal): Promise<ReturnRequestsIndex> {
    const response = await $http.get({
      url: '/dashboard/return-requests',
      signal,
      suppressErrorNotification: true,
    })
    const envelope = returnRequestIndexEnvelopeSchema.parse(response.data)
    return {
      items: envelope.data.map(normalizeReturnRequest),
      meta: { currentPage: envelope.meta.current_page, perPage: envelope.meta.per_page },
    }
  },
  async show(id: number, signal?: AbortSignal) {
    validId.parse(id)
    const response = await $http.get({
      url: `/dashboard/return-requests/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    const detail = normalizeReturnRequest(returnRequestSuccessEnvelopeSchema.parse(response.data).data)
    if (detail.id !== id) throw new Error('Return request identity mismatch')
    return detail
  },
  async approve(id: number, decisionNote: string): Promise<ReturnRequestDecisionResult> {
    validId.parse(id)
    const trimmedNote = z.string().parse(decisionNote).trim()
    const response = await $http.post({
      url: `/dashboard/return-requests/${id}/approve`,
      data: { decision_note: trimmedNote || null },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    decisionFailure(response.data)
    const envelope = returnRequestSuccessEnvelopeSchema.parse(response.data)
    const detail = normalizeReturnRequest(envelope.data)
    if (detail.id !== id) throw new Error('Return request identity mismatch')
    return { message: message(envelope.message), detail }
  },
  async reject(id: number, decisionNote: string): Promise<ReturnRequestDecisionResult> {
    validId.parse(id)
    const trimmedNote = z.string().trim().min(1).parse(decisionNote)
    const response = await $http.post({
      url: `/dashboard/return-requests/${id}/reject`,
      data: { decision_note: trimmedNote },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    decisionFailure(response.data)
    const envelope = returnRequestSuccessEnvelopeSchema.parse(response.data)
    let detail = null
    try {
      const parsed = normalizeReturnRequest(envelope.data)
      if (parsed.id === id) detail = parsed
    } catch {
      // Reject success data is unconfirmed; canonical Show is always refreshed.
    }
    return { message: message(envelope.message), detail }
  },
}
