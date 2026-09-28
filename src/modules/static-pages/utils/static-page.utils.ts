import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type {
  StaticPage,
  StaticPageCreatePayload,
  StaticPageFormValues,
  StaticPageUpdatePayload,
} from '@/modules/static-pages/types/static-page.types'

export function normalizeStaticPageSlug(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/gu, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getLocalizedStaticPageTitle(page: StaticPage, language: string, fallback: string): string {
  const preferred = language.startsWith('ar') ? page.title.ar : page.title.en
  return preferred?.trim() || page.title.ar?.trim() || page.title.en?.trim() || fallback
}

export function toStaticPageFormValues(page: StaticPage): StaticPageFormValues {
  return {
    slug: page.slug,
    title: { ar: page.title.ar ?? '', en: page.title.en ?? '' },
    content: { ar: page.content.ar ?? '', en: page.content.en ?? '' },
    isPublished: page.isPublished,
    isSystem: page.isSystem,
  }
}

export function buildStaticPageCreatePayload(values: StaticPageFormValues): StaticPageCreatePayload {
  return {
    slug: normalizeStaticPageSlug(values.slug),
    title: { ar: values.title.ar.trim(), en: values.title.en.trim() },
    content: { ar: values.content.ar.trim(), en: values.content.en.trim() },
    isPublished: values.isPublished,
    isSystem: values.isSystem,
  }
}

export function buildStaticPageUpdatePayload(
  values: StaticPageFormValues,
  dirty: Partial<Readonly<FieldNamesMarkedBoolean<StaticPageFormValues>>>
): StaticPageUpdatePayload {
  const payload: StaticPageUpdatePayload = {}
  if (dirty.slug) payload.slug = normalizeStaticPageSlug(values.slug)
  if (dirty.title?.ar) payload.title = { ...payload.title, ar: values.title.ar.trim() }
  if (dirty.title?.en) payload.title = { ...payload.title, en: values.title.en.trim() }
  if (dirty.content?.ar) payload.content = { ...payload.content, ar: values.content.ar.trim() }
  if (dirty.content?.en) payload.content = { ...payload.content, en: values.content.en.trim() }
  if (dirty.isPublished) payload.isPublished = values.isPublished
  if (dirty.isSystem) payload.isSystem = values.isSystem
  return payload
}
