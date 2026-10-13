import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/config/i18'
import i18n from '@/config/i18'
import { reviewModerationTargets } from '@/modules/reviews/types/review.types'
import { storeRatingsService } from '../api/store-ratings.service'
import { storeRatingsKeys } from '../queries/store-ratings.keys'
import { useModerateStoreRating } from './useModerateStoreRating'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))
function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 3, retryDelay: 0 } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { ...renderHook(useModerateStoreRating, { wrapper }), client }
}
describe('Store Rating moderation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })
  it.each(reviewModerationTargets)('invalidates only Store Ratings after %s', async (status) => {
    vi.spyOn(storeRatingsService, 'moderate').mockResolvedValue()
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await act(() => result.current.mutateAsync({ id: 2, status }))
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: storeRatingsKeys.lists() })
  })
  it.each([
    {
      error: { isAxiosError: true, response: { data: { message: '  Rating already moderated.  ' } } },
      message: 'Rating already moderated.',
    },
    { error: { isAxiosError: true, response: { data: { message: '   ' } } }, message: null },
    { error: { isAxiosError: true, response: { data: { message: { internal: 'private' } } } }, message: null },
    { error: new Error('private request details'), message: null },
  ])('uses safe server messages or localized fallback without retrying', async ({ error, message }) => {
    const moderate = vi.spyOn(storeRatingsService, 'moderate').mockRejectedValue(error)
    const { result, client } = setup()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await act(async () => {
      await expect(result.current.mutateAsync({ id: 2, status: 'approved' })).rejects.toBe(error)
    })
    expect(moderate).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(message ?? i18n.t('storeRatings.feedback.approveError'))
    expect(invalidate).not.toHaveBeenCalled()
  })
})
