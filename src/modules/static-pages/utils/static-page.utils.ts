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
  }
}

export function buildStaticPageCreatePayload(values: StaticPageFormValues): StaticPageCreatePayload {
  return {
    slug: normalizeStaticPageSlug(values.slug),
    title: { ar: values.title.ar.trim(), en: values.title.en.trim() },
    content: { ar: values.content.ar.trim(), en: values.content.en.trim() },
    isPublished: values.isPublished,
  }
}

type BuildStaticPageUpdatePayloadOptions = {
  values: StaticPageFormValues
  originalPage: StaticPage
  slugWasEdited: boolean
}

export function buildStaticPageUpdatePayload({
  values,
  originalPage,
  slugWasEdited,
}: BuildStaticPageUpdatePayloadOptions): StaticPageUpdatePayload {
  return {
    slug: slugWasEdited ? normalizeStaticPageSlug(values.slug) : originalPage.slug,
    title: { ar: values.title.ar.trim(), en: values.title.en.trim() },
    content: { ar: values.content.ar.trim(), en: values.content.en.trim() },
    isPublished: values.isPublished,
  }
}
