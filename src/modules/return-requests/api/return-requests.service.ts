import { z } from 'zod'
import { $http } from '@/utils/http'
import {
  returnRequestFailureEnvelopeSchema,
  returnRequestIndexEnvelopeSchema,
  returnRequestSuccessEnvelopeSchema,
} from '../schemas/return-request.schema'
import type { ReturnRequest, ReturnRequestDecisionResult, ReturnRequestsFilters } from '../types/return-request.types'
import { ReturnRequestDecisionError } from '../utils/return-request-errors'
import { emptyReturnRequestsFilters, serializeReturnRequestsFilters } from '../utils/return-request-filters'
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
  async list(
    filters: ReturnRequestsFilters = emptyReturnRequestsFilters,
    page = 1,
    signal?: AbortSignal
  ): Promise<PaginatedData<ReturnRequest>> {
    const response = await $http.get({
      url: '/dashboard/return-requests',
      query: { ...serializeReturnRequestsFilters(filters), page },
      signal,
      suppressErrorNotification: true,
    })
    const envelope = returnRequestIndexEnvelopeSchema.parse(response.data)
    const items = envelope.data.map(normalizeReturnRequest)
    const hasNextPage = items.length === envelope.meta.per_page
    return {
      items,
      paginate: {
        current_page: envelope.meta.current_page,
        total_pages: hasNextPage ? envelope.meta.current_page + 1 : envelope.meta.current_page,
        per_page: envelope.meta.per_page,
        total: items.length,
        count: items.length,
        next_page_url: hasNextPage ? String(envelope.meta.current_page + 1) : null,
        prev_page_url: envelope.meta.current_page > 1 ? String(envelope.meta.current_page - 1) : null,
      },
      extra: null,
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
