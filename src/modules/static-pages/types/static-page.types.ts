import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type StaticPageLocalizedText = {
  ar: string | null
  en: string | null
}

export type StaticPage = {
  id: number
  slug: string
  title: StaticPageLocalizedText
  content: StaticPageLocalizedText
  isPublished: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export type StaticPageFormValues = {
  slug: string
  title: { ar: string; en: string }
  content: { ar: string; en: string }
  isPublished: boolean
}

export type StaticPageCreatePayload = StaticPageFormValues
export type StaticPageUpdatePayload = StaticPageFormValues

export type RawStaticPage = {
  id: number
  slug: string
  title: Partial<Record<'ar' | 'en', string | null>>
  content: Partial<Record<'ar' | 'en', string | null>>
  is_published: boolean | 0 | 1
  is_system: boolean | 0 | 1
  created_at: string
  updated_at: string
}

export type StaticPagesIndexResponse = PaginatedDashboardResponse<RawStaticPage>
export type RawStaticPageResponse = {
  success: boolean
  message: string
  data: RawStaticPage
}

export type RawStaticPageUpdateResponse = {
  success: boolean
  message: string
  data?: RawStaticPage
}
