import type { Category, LocalizedText, RawCategory } from '@/modules/categories/types/category.types'

function normalizeDescription(value: RawCategory['description']): LocalizedText | null {
  if (!value || Array.isArray(value)) return null
  const ar = typeof value.ar === 'string' ? value.ar : ''
  const en = typeof value.en === 'string' ? value.en : ''
  return ar.trim() || en.trim() ? { ar, en } : null
}

export function normalizeCategory(category: RawCategory): Category {
  return {
    ...category,
    parent_id: category.parent_id === null || category.parent_id === '' ? null : Number(category.parent_id),
    sort_order: Number(category.sort_order),
    description: normalizeDescription(category.description),
    children_count: Number(category.children_count ?? 0),
  }
}
