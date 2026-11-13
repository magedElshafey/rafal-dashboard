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

function trimLocalized(values: LocalizedName): LocalizedName {
  return { ar: values.ar.trim(), en: values.en.trim() }
}

export function buildAboutUsUpdatePayload(
  values: AboutUsFormValues,
  dirty: Partial<Readonly<FieldNamesMarkedBoolean<AboutUsFormValues>>>
): AboutUsUpdatePayload {
  // The update endpoint requires every text section, even when only a feature or image changes.
  const payload: AboutUsUpdatePayload = {
    heroTitle: trimLocalized(values.heroTitle),
    heroSubtitle: trimLocalized(values.heroSubtitle),
    story: trimLocalized(values.story),
    vision: trimLocalized(values.vision),
    mission: trimLocalized(values.mission),
  }
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
