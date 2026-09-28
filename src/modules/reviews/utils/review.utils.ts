import type { ReviewReviewer } from '@/modules/reviews/types/review.types'

function nonEmpty(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function getReviewerDisplayName(reviewer: ReviewReviewer, fallback: string): string {
  const firstName = nonEmpty(reviewer.firstName)
  const lastName = nonEmpty(reviewer.lastName)
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return fullName || nonEmpty(reviewer.email) || fallback
}
