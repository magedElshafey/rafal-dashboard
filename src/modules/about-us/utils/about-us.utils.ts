import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type {
  AboutUs,
  AboutUsFeatureFormValues,
  AboutUsFormValues,
  AboutUsLocalizedText,
  AboutUsUpdatePayload,
} from '@/modules/about-us/types/about-us.types'
import type { LocalizedName } from '@/types/localized-name.types'

export function createEmptyImageUploadValue(): ImageUploadValue {
  return { files: [], removedExistingIds: [] }
}

export function createEmptyAboutUsFeature(): AboutUsFeatureFormValues {
  return {
    key: null,
    title: { ar: '', en: '' },
    subtitle: { ar: '', en: '' },
    iconUrl: null,
    icon: createEmptyImageUploadValue(),
  }
}

function toFormLocalized(value: AboutUsLocalizedText): LocalizedName {
  return { ar: value.ar ?? '', en: value.en ?? '' }
}

export function toAboutUsFormValues(aboutUs: AboutUs): AboutUsFormValues {
  return {
    heroTitle: toFormLocalized(aboutUs.heroTitle),
    heroSubtitle: toFormLocalized(aboutUs.heroSubtitle),
    heroImageUrl: aboutUs.heroImageUrl,
    hero: createEmptyImageUploadValue(),
    story: toFormLocalized(aboutUs.story),
    vision: toFormLocalized(aboutUs.vision),
    mission: toFormLocalized(aboutUs.mission),
    features: aboutUs.features.map((feature) => ({
      key: feature.key,
      title: toFormLocalized(feature.title),
      subtitle: toFormLocalized(feature.subtitle),
      iconUrl: feature.iconUrl,
      icon: createEmptyImageUploadValue(),
    })),
  }
}

function buildDirtyLocalized(
  values: LocalizedName,
  dirty: { ar?: boolean; en?: boolean } | undefined
): Partial<LocalizedName> | undefined {
  const result: Partial<LocalizedName> = {}
  if (dirty?.ar) result.ar = values.ar.trim()
  if (dirty?.en) result.en = values.en.trim()
  return result.ar !== undefined || result.en !== undefined ? result : undefined
}

export function buildAboutUsUpdatePayload(
  values: AboutUsFormValues,
  dirty: Partial<Readonly<FieldNamesMarkedBoolean<AboutUsFormValues>>>
): AboutUsUpdatePayload {
  const payload: AboutUsUpdatePayload = {}
  const heroTitle = buildDirtyLocalized(values.heroTitle, dirty.heroTitle)
  const heroSubtitle = buildDirtyLocalized(values.heroSubtitle, dirty.heroSubtitle)
  const story = buildDirtyLocalized(values.story, dirty.story)
  const vision = buildDirtyLocalized(values.vision, dirty.vision)
  const mission = buildDirtyLocalized(values.mission, dirty.mission)
  if (heroTitle) payload.heroTitle = heroTitle
  if (heroSubtitle) payload.heroSubtitle = heroSubtitle
  if (story) payload.story = story
  if (vision) payload.vision = vision
  if (mission) payload.mission = mission
  if (dirty.hero && values.hero.files[0]) payload.hero = values.hero.files[0]
  if (dirty.features !== undefined) {
    payload.features = values.features.map((feature) => ({
      ...(feature.key ? { key: feature.key } : {}),
      title: { ar: feature.title.ar.trim(), en: feature.title.en.trim() },
      subtitle: { ar: feature.subtitle.ar.trim(), en: feature.subtitle.en.trim() },
      ...(feature.icon.files[0] ? { icon: feature.icon.files[0] } : {}),
    }))
  }
  return payload
}
