import { isAxiosError } from 'axios'
import { OrderTransitionError } from '../api/orders.service'
import { failureEnvelopeSchema } from '../schemas/order.schema'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'

export function orderTransitionFeedback(error: unknown, fallback: string) {
  const payload =
    error instanceof OrderTransitionError
      ? error.feedback
      : isAxiosError<unknown>(error)
        ? error.response?.data
        : undefined
  const parsed = failureEnvelopeSchema.safeParse(payload)
  return {
    message: parsed.success
      ? parsed.data.message?.trim() || parsed.data.errors?.status?.[0] || fallback
      : getApiErrorMessage(error, fallback),
    statusError: parsed.success ? parsed.data.errors?.status?.join(' ') : undefined,
    stale: parsed.success && parsed.data.errors?.allowed_transitions !== undefined,
  }
}
