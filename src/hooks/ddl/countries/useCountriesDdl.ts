import { useQuery } from '@tanstack/react-query'

import { getCountriesDdl } from '@/services/ddl/countries.ddl.service'
import type { CountryDdlOption } from '@/types/country-ddl.types'

export const countriesDdlQueryKey = ['ddl', 'countries'] as const

const EMPTY_COUNTRIES_DDL: CountryDdlOption[] = []

export function useCountriesDdl() {
  const query = useQuery({
    queryKey: countriesDdlQueryKey,
    queryFn: getCountriesDdl,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_COUNTRIES_DDL,
  }
}
