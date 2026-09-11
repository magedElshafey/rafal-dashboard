import { $authHttp } from '@/utils/auth-http'
import type { CountryDdlOption } from '@/types/country-ddl.types'

export async function getCountriesDdl(): Promise<CountryDdlOption[]> {
  const res = await $authHttp.get<ApiResponse<CountryDdlOption[]>>({
    url: '/v1/ddl/countries',
  })

  return res.data?.data ?? []
}
