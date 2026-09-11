import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query'

type InfinitePaginatedData<TItem, TExtra> = InfiniteData<PaginatedData<TItem, TExtra>, number>

type UseInfinitePaginatedQueryParams<TItem, TExtra> = {
  queryKey: QueryKey
  queryFn: (page: number, signal?: AbortSignal) => Promise<PaginatedData<TItem, TExtra>>

  initialPage?: number
  enabled?: boolean

  staleTime?: number
  gcTime?: number
  retry?: boolean | number
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean

  placeholderData?: (
    previousData: InfinitePaginatedData<TItem, TExtra> | undefined
  ) => InfinitePaginatedData<TItem, TExtra> | undefined
}

export function useInfinitePaginatedQuery<TItem, TExtra = null>({
  queryKey,
  queryFn,
  initialPage = 1,
  enabled = true,
  staleTime,
  gcTime,
  retry,
  refetchOnMount,
  refetchOnWindowFocus,
  refetchOnReconnect,
  placeholderData,
}: UseInfinitePaginatedQueryParams<TItem, TExtra>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => queryFn(pageParam, signal),
    initialPageParam: initialPage,

    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.paginate.current_page)
      const totalPages = Number(lastPage.paginate.total_pages)

      if (!Number.isFinite(currentPage)) {
        return undefined
      }

      if (Number.isFinite(totalPages)) {
        return currentPage < totalPages ? currentPage + 1 : undefined
      }

      return lastPage.paginate.next_page_url ? currentPage + 1 : undefined
    },

    enabled,
    staleTime,
    gcTime,
    retry,
    refetchOnMount,
    refetchOnWindowFocus,
    refetchOnReconnect,
    placeholderData,
  })
}
