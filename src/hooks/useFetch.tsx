// React-Query
import { useQuery } from '@tanstack/react-query'

import type { QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/react-query'

// Hooks
import { $http } from '@/utils/http.ts'
import type { QueryParams } from '@/utils/query-params'

type ApiResponse<T> = {
  data: T
}

interface Props<T> {
  reqName?: string
  query?: QueryParams
  queryKey: QueryKey
  queryFn?: QueryFunction<ApiResponse<T>, QueryKey>
  options?: Omit<UseQueryOptions<ApiResponse<T>, unknown, T, QueryKey>, 'queryKey' | 'queryFn'>
}

export default function useFetch<T>({ queryKey, queryFn, options, reqName, query }: Props<T>) {
  const commonFetchFunction: QueryFunction<ApiResponse<T>, QueryKey> = async () => {
    try {
      const res = await $http.get<{ data: T }>({
        url: reqName!,
        ...(query && { query }),
      })
      return res.data
    } catch (e) {
      console.log(e)

      // Error Logic Will Handled By Axios Interceptor
      throw e
    }
  }
  const res = useQuery<ApiResponse<T>, unknown, T, QueryKey>({
    queryKey: [...queryKey, query],
    queryFn: queryFn ?? commonFetchFunction,
    refetchOnWindowFocus: false,
    ...options,
  })

  return { ...res }
}
