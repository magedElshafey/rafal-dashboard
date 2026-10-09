import type { RegionsFilters } from '../types/region.types'

export const regionsKeys = {
  all: ['regions'] as const,
  lists: () => [...regionsKeys.all, 'list'] as const,
  list: (filters: RegionsFilters) => [...regionsKeys.lists(), filters] as const,
}
