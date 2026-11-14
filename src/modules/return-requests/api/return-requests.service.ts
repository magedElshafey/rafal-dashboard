import { z } from 'zod'
import { $http } from '@/utils/http'
import {
  rawReturnRequestSchema,
  returnRequestFailureEnvelopeSchema,
  returnRequestIndexEnvelopeSchema,
  returnRequestSuccessEnvelopeSchema,
} from '../schemas/return-request.schema'
import type {
  ReturnRequest,
  ReturnRequestDecisionResult,
  ReturnRequestsFilters,
  ReturnRequestsIndex,
} from '../types/return-request.types'
import { ReturnRequestDecisionError } from '../utils/return-request-errors'
import { emptyReturnRequestsFilters, serializeReturnRequestsFilters } from '../utils/return-request-filters'
import { normalizeReturnRequest } from '../utils/return-request-normalizers'

const validId = z.number().int().positive().safe()

function decisionFailure(value: unknown) {
  if (!z.object({ success: z.literal(false) }).safeParse(value).success) return
  const parsed = returnRequestFailureEnvelopeSchema.safeParse(value)
  throw new ReturnRequestDecisionError(parsed.success ? parsed.data : {})
}

function message(value: string | undefined) {
  return value?.trim() || undefined
}

export const returnRequestsService = {
  async list(
    filters: ReturnRequestsFilters = emptyReturnRequestsFilters,
    page = 1,
    signal?: AbortSignal
  ): Promise<ReturnRequestsIndex> {
    const response = await $http.get({
      url: '/dashboard/return-requests',
      query: { ...serializeReturnRequestsFilters(filters), page },
      signal,
      suppressErrorNotification: true,
    })
    const envelope = returnRequestIndexEnvelopeSchema.parse(response.data)
    const items: ReturnRequest[] = []
    const invalidRows: ReturnRequestsIndex['invalidRows'] = []
    envelope.data.forEach((row, index) => {
      const parsed = rawReturnRequestSchema.safeParse(row)
      if (parsed.success) items.push(normalizeReturnRequest(parsed.data))
      else invalidRows.push({ row: index + 1, fields: parsed.error.issues.map((issue) => issue.path.join('.')) })
    })
    // A full raw page permits probing the next page when last_page is unavailable.
    // Navigation state is separate from authoritative backend totals.
    const hasNextPage =
      envelope.meta.last_page !== undefined
        ? envelope.meta.current_page < envelope.meta.last_page
        : envelope.data.length === envelope.meta.per_page
    return {
      items,
      paginate: {
        current_page: envelope.meta.current_page,
        per_page: envelope.meta.per_page,
        ...(envelope.meta.last_page !== undefined ? { total_pages: envelope.meta.last_page } : {}),
        ...(envelope.meta.total !== undefined ? { total: envelope.meta.total } : {}),
      },
      nextPage: hasNextPage ? envelope.meta.current_page + 1 : undefined,
      invalidRows,
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
    // HTTP success is authoritative; Reject has no confirmed response body contract.
    const envelope = returnRequestSuccessEnvelopeSchema.safeParse(response.data)
    return { message: envelope.success ? message(envelope.data.message) : undefined, detail: null }
  },
}
