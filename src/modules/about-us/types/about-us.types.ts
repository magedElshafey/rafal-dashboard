import type { ImageUploadValue } from '@/components/form/image-upload'
import type { LocalizedName } from '@/types/localized-name.types'

export type AboutUsLocalizedText = {
  ar: string | null
  en: string | null
}

export type RawAboutUsLocalizedText = {
  ar?: string | null
  en?: string | null
}

export type AboutUsFeature = {
  key: string
  title: AboutUsLocalizedText
  subtitle: AboutUsLocalizedText
  iconUrl: string | null
}

export type AboutUs = {
  id: number
  heroTitle: AboutUsLocalizedText
  heroSubtitle: AboutUsLocalizedText
  heroImageUrl: string | null
  story: AboutUsLocalizedText
  vision: AboutUsLocalizedText
  mission: AboutUsLocalizedText
  features: AboutUsFeature[]
  createdAt: string
  updatedAt: string
}

export type AboutUsFeatureFormValues = {
  key: string | null
  title: LocalizedName
  subtitle: LocalizedName
  iconUrl: string | null
  icon: ImageUploadValue
}

export type AboutUsFormValues = {
  heroTitle: LocalizedName
  heroSubtitle: LocalizedName
  heroImageUrl: string | null
  hero: ImageUploadValue
  story: LocalizedName
  vision: LocalizedName
  mission: LocalizedName
  features: AboutUsFeatureFormValues[]
}

export type AboutUsUpdateFeature = {
  key?: string
  title: LocalizedName
  subtitle: LocalizedName
  icon?: File
}

export type AboutUsUpdatePayload = {
  heroTitle?: Partial<LocalizedName>
  heroSubtitle?: Partial<LocalizedName>
  story?: Partial<LocalizedName>
  vision?: Partial<LocalizedName>
  mission?: Partial<LocalizedName>
  hero?: File
  features?: AboutUsUpdateFeature[]
}

export type RawAboutUsFeature = {
  key: string
  title: RawAboutUsLocalizedText
  subtitle: RawAboutUsLocalizedText
  icon_url: string | null
}

export type RawAboutUs = {
  id: number
  hero_title: RawAboutUsLocalizedText
  hero_subtitle: RawAboutUsLocalizedText
  hero_image_url: string | null
  story: RawAboutUsLocalizedText
  vision: RawAboutUsLocalizedText
  mission: RawAboutUsLocalizedText
  features: RawAboutUsFeature[]
  created_at: string
  updated_at: string
}

export type RawAboutUsResponse = {
  success: boolean
  message: string
  data: RawAboutUs | null
}
