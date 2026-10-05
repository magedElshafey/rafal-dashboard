import { isAxiosError } from 'axios'

type DecisionFeedback = {
  message?: string
  errors?: { decision_note?: string[] }
}

export class ReturnRequestDecisionError extends Error {
  constructor(public readonly feedback: DecisionFeedback) {
    super('Return request decision rejected')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function feedbackFromResponse(value: unknown): DecisionFeedback {
  if (!isRecord(value)) return {}
  const errors = isRecord(value.errors) ? value.errors : undefined
  const decisionNote = Array.isArray(errors?.decision_note)
    ? errors.decision_note.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : undefined
  return {
    message: safeText(value.message),
    errors: decisionNote?.length ? { decision_note: decisionNote } : undefined,
  }
}

export function returnRequestDecisionFeedback(error: unknown, fallback: string) {
  const feedback =
    error instanceof ReturnRequestDecisionError
      ? error.feedback
      : isAxiosError(error)
        ? feedbackFromResponse(error.response?.data)
        : {}
  return {
    message: safeText(feedback.message) ?? fallback,
    decisionNoteError: feedback.errors?.decision_note?.[0],
  }
}
