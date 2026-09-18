import type { LocalizedName } from '@/modules/regions/types/region.types'

export function getLocalizedRegionName(name: LocalizedName, language: string) {
  const preferred = language.startsWith('ar') ? name.ar : name.en
  return preferred.trim() || name.ar.trim() || name.en.trim() || '—'
}
