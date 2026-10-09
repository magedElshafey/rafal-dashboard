import type { CitiesFilters } from '../types/city.types'

export const citiesKeys = {
  all: ['cities'] as const,
  lists: () => [...citiesKeys.all, 'list'] as const,
  list: (filters: CitiesFilters) => [...citiesKeys.lists(), filters] as const,
}
