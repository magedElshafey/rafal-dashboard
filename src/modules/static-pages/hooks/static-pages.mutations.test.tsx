import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPage, StaticPageUpdatePayload } from '@/modules/static-pages/types/static-page.types'
import { useUpdateStaticPage } from './useUpdateStaticPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const page: StaticPage = {
  id: 7,
  slug: 'Legacy Slug',
  title: { ar: 'سياسة', en: 'Privacy' },
  content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
  isPublished: true,
  isSystem: false,
  createdAt: '2026-09-28T13:31:50+00:00',
  updatedAt: '2026-09-29T00:00:00+00:00',
}

const updatePayload: StaticPageUpdatePayload = {
  slug: page.slug,
  title: { ar: page.title.ar ?? '', en: page.title.en ?? '' },
  content: { ar: page.content.ar ?? '', en: page.content.en ?? '' },
  isPublished: page.isPublished,
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
  const setQueryData = vi.spyOn(client, 'setQueryData')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, invalidateQueries, setQueryData, wrapper }
}

describe('Static Page mutation cache ownership', () => {
  afterEach(() => vi.restoreAllMocks())

  it('refetches exact Show after a message-only Update, then owns only its detail and lists', async () => {
    vi.spyOn(staticPagesService, 'update').mockResolvedValue(null)
    const show = vi.spyOn(staticPagesService, 'show').mockResolvedValue(page)
    const { invalidateQueries, setQueryData, wrapper } = setup()
    const { result } = renderHook(() => useUpdateStaticPage(7), { wrapper })

    await act(() => result.current.mutateAsync(updatePayload))

    expect(show).toHaveBeenCalledWith(7, expect.any(AbortSignal))
    expect(setQueryData).toHaveBeenCalledWith(staticPagesKeys.detail(7), page)
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: staticPagesKeys.lists() })
  })
})
