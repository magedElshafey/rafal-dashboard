import { useQuery } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import { getAssistantsDdl } from '@/services/ddl/assistants.ddl.service'

import { assistantsDdlQueryKeys } from './assistants-ddl.query-keys'

const EMPTY_ASSISTANTS_DDL: IDDl[] = []

type AssistantsDdlMode = 'subgroup' | 'unfiltered'

export function useAssistantsDdl(subGroupId?: string | null, mode: AssistantsDdlMode = 'subgroup') {
  const normalizedSubGroupId = subGroupId?.trim() ?? ''
  const isUnfiltered = mode === 'unfiltered'

  const query = useQuery({
    queryKey: isUnfiltered
      ? assistantsDdlQueryKeys.unfiltered()
      : assistantsDdlQueryKeys.bySubGroup(normalizedSubGroupId),
    queryFn: () => getAssistantsDdl(isUnfiltered ? {} : { group: normalizedSubGroupId }),
    enabled: isUnfiltered || Boolean(normalizedSubGroupId),
    staleTime: queryTimes.long,
    gcTime: queryTimes.long,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_ASSISTANTS_DDL,
  }
}
