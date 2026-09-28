import { useQuery } from '@tanstack/react-query'

import { aboutUsService } from '@/modules/about-us/api/about-us.service'
import { aboutUsKeys } from '@/modules/about-us/queries/about-us.keys'

export function useAboutUs() {
  return useQuery({
    queryKey: aboutUsKeys.detail(),
    queryFn: ({ signal }) => aboutUsService.get(signal),
    retry: false,
  })
}
