import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCountriesDdl } from '@/services/ddl/countries.ddl.service'

import { countriesDdlQueryKey, useCountriesDdl } from './useCountriesDdl'

vi.mock('@/services/ddl/countries.ddl.service', () => ({ getCountriesDdl: vi.fn() }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useCountriesDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shares one request between multiple fields using the stable query key', async () => {
    const countries = [{ value: 'eg', label: 'Egypt', iso2: 'EG', phone_code: '+20' }]
    vi.mocked(getCountriesDdl).mockResolvedValue(countries)

    const { result } = renderHook(() => [useCountriesDdl(), useCountriesDdl()] as const, {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true))

    expect(getCountriesDdl).toHaveBeenCalledTimes(1)
    expect(result.current[0].data).toEqual(countries)
    expect(result.current[1].data).toEqual(countries)
    expect(countriesDdlQueryKey).toEqual(['ddl', 'countries'])
  })
})
