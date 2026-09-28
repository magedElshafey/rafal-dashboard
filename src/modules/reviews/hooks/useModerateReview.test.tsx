import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { reviewsService } from '@/modules/reviews/api/reviews.service'
import { useModerateReview } from '@/modules/reviews/hooks/useModerateReview'
import { reviewsKeys } from '@/modules/reviews/queries/reviews.keys'
import type { ReviewResponse } from '@/modules/reviews/types/review.types'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const response: ReviewResponse = {
  success: true,
  message: 'ok',
  data: {
    id: 4,
    rating: 5,
    comment: 'Good product',
    status: 'approved',
    adminResponse: null,
    helpfulCount: 0,
    reportsCount: 0,
    reviewer: { id: 1, firstName: 'Abdullah', lastName: 'Essam', email: 'reviewer@example.com' },
    product: { id: 20, name: 'Product', slug: 'product' },
    createdAt: '2026-09-23T17:53:47+00:00',
    updatedAt: '2026-09-23T17:55:59+00:00',
  },
}

describe('Review moderation cache ownership', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['approved', 'rejected'] as const)('invalidates only Review lists after %s', async (status) => {
    vi.spyOn(reviewsService, 'moderate').mockResolvedValue({ ...response, data: { ...response.data, status } })
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useModerateReview, { wrapper })

    await act(() => result.current.mutateAsync({ id: 4, status }))

    expect(reviewsService.moderate).toHaveBeenCalledWith(4, status)
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: reviewsKeys.lists() })
  })
})
