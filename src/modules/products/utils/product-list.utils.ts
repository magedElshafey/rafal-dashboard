import type { LocalizedName } from '@/types/localized-name.types'

export function getLocalizedProductName(name: LocalizedName, language: string) {
  const preferred = language.startsWith('ar') ? name.ar : name.en
  return preferred.trim() || name.ar.trim() || name.en.trim() || '—'
}
