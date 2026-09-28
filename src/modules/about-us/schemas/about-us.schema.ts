import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { AboutUsFormValues } from '@/modules/about-us/types/about-us.types'

export type AboutUsValidationMessages = { required: string }

export function createAboutUsSchema(messages: AboutUsValidationMessages) {
  const localized = () =>
    yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    })
  const media = () => yup.mixed<ImageUploadValue>().defined()

  return yup.object<AboutUsFormValues>({
    heroTitle: localized(),
    heroSubtitle: localized(),
    heroImageUrl: yup.string().nullable().defined(),
    hero: media(),
    story: localized(),
    vision: localized(),
    mission: localized(),
    features: yup
      .array()
      .of(
        yup.object({
          key: yup.string().nullable().defined(),
          title: localized(),
          subtitle: localized(),
          iconUrl: yup.string().nullable().defined(),
          icon: media(),
        })
      )
      .defined(),
  })
}
