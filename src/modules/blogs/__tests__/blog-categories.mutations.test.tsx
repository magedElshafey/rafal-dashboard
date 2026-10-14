import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { useUpdateBlogCategory } from '../hooks/categories/useUpdateBlogCategory'
import { useDeleteBlogCategory } from '../hooks/categories/useDeleteBlogCategory'
import { useBlogCategories } from '../hooks/categories/useBlogCategories'
import { blogCategoriesKeys } from '../queries/blog-categories.keys'
import { blogPostsKeys } from '../queries/blog-posts.keys'
import { readBlogCategoriesFilters } from '../utils/blog-category-filters'
import { readBlogPostsFilters } from '../utils/blog-post-filters'
import { normalizeBlogCategory } from '../api/blog-categories.service'
import type { BlogCategory } from '../types/blog-category.types'
import fixture from './blog-categories.fixture.json'
import { deferred } from './blogs-test-utils'
const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
beforeEach(async () => {
  vi.resetAllMocks()
  await i18n.changeLanguage('en')
})
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  })
  const filters = readBlogCategoriesFilters({ search: 'Personalization', sort_by: 'name', sort_dir: 'asc' })
  const key = blogCategoriesKeys.list(filters)
  const data: InfiniteData<PaginatedData<BlogCategory>> = {
    pages: [
      {
        items: [normalizeBlogCategory(fixture.data[0])],
        paginate: {
          current_page: 1,
          total_pages: 1,
          total: 1,
          per_page: 15,
          count: 1,
          next_page_url: null,
          prev_page_url: null,
        },
        extra: null,
      },
    ],
    pageParams: [1],
  }
  client.setQueryData(key, data)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, key, data, filters, wrapper }
}
describe('blog category cache coherence and races', () => {
  it.each(['update', 'delete'])(
    'replaces the complete filtered snapshot after %s and ignores late old reads',
    async (op) => {
      const { client, key, filters, wrapper } = setup()
      const oldRead = deferred<unknown>()
      http.get
        .mockReturnValueOnce(oldRead.promise)
        .mockResolvedValueOnce({ data: { ...fixture, data: [], meta: { ...fixture.meta, total: 0 } } })
      http.put.mockResolvedValue({
        data: { success: true, message: 'updated', data: { ...fixture.data[0], name: { ar: 'محدث', en: 'Zebra' } } },
      })
      http.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
      const { result } = renderHook(
        () => ({ list: useBlogCategories(filters), update: useUpdateBlogCategory(), remove: useDeleteBlogCategory() }),
        { wrapper }
      )
      // Mount starts the stale cached list read; do not start a second read in the test.
      const signal = http.get.mock.calls[0][0].signal as AbortSignal
      await act(async () => {
        if (op === 'update')
          await result.current.update.mutateAsync({
            id: 10,
            values: { slug: 'personalization', name: { ar: 'محدث', en: 'Zebra' } },
          })
        else await result.current.remove.mutateAsync(10)
      })
      expect(signal.aborted).toBe(true)
      expect(client.getQueryData(key)).toMatchObject({ pages: [{ items: [], paginate: { total: 0, count: 0 } }] })
      await act(async () => {
        oldRead.resolve({ data: fixture })
        await oldRead.promise
      })
      expect(client.getQueryData(key)).toMatchObject({ pages: [{ items: [], paginate: { total: 0, count: 0 } }] })
      expect(http.get).toHaveBeenCalledTimes(2)
    }
  )
  it.each(['update', 'delete'])('retains a coherent stale snapshot when the %s refetch fails', async (op) => {
    const { client, key, data, filters, wrapper } = setup()
    http.get.mockRejectedValue(new Error('offline'))
    http.put.mockResolvedValue({
      data: { success: true, message: 'updated', data: { ...fixture.data[0], name: { ar: 'محدث', en: 'Zebra' } } },
    })
    http.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    const postKey = blogPostsKeys.list(readBlogPostsFilters(null))
    client.setQueryData(postKey, { snapshot: 'old' })
    const late = deferred<{ snapshot: string }>()
    const postFetch = client
      .fetchQuery({ queryKey: postKey, staleTime: 0, queryFn: () => late.promise })
      .catch(() => undefined)
    client.setQueryData(['unrelated'], { keep: true })
    const { result } = renderHook(
      () => ({ list: useBlogCategories(filters), update: useUpdateBlogCategory(), remove: useDeleteBlogCategory() }),
      { wrapper }
    )
    await act(async () => {
      if (op === 'update')
        await result.current.update.mutateAsync({
          id: 10,
          values: { slug: 'personalization', name: { ar: 'محدث', en: 'Zebra' } },
        })
      else await result.current.remove.mutateAsync(10)
    })
    expect(client.getQueryData(key)).toEqual(data)
    await waitFor(() => expect(result.current.list.isRefetchError).toBe(true))
    expect(client.getQueryState(key)?.isInvalidated).toBe(true)
    await act(async () => {
      late.resolve({ snapshot: 'late' })
      await postFetch
    })
    expect(client.getQueryData(postKey)).toEqual({ snapshot: 'old' })
    expect(client.getQueryState(postKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
  })
})
