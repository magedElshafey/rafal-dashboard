import { describe, expect, it } from 'vitest'

import { getReviewerDisplayName } from '@/modules/reviews/utils/review.utils'

const reviewer = {
  id: 1,
  firstName: ' Abdullah ',
  lastName: ' Essam ',
  email: ' reviewer@example.com ',
}

describe('Review utilities', () => {
  it.each([
    [reviewer, 'Abdullah Essam'],
    [{ ...reviewer, lastName: null }, 'Abdullah'],
    [{ ...reviewer, firstName: '', lastName: null }, 'reviewer@example.com'],
    [{ ...reviewer, firstName: '', lastName: null, email: '' }, 'User #1'],
  ])('uses the documented reviewer display-name priority', (value, expected) => {
    expect(getReviewerDisplayName(value, 'User #1')).toBe(expected)
  })
})
