import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import type { BannerFormValues, BannerPlacement, BannerPlatform } from '@/modules/banners/types/banner.types'

type Messages = {
  titleArRequired: string
  titleEnRequired: string
  placementRequired: string
  platformRequired: string
  linkInvalid: string
  dateInvalid: string
  endBeforeStart: string
  sortRequired: string
  sortInteger: string
  sortNonNegative: string
  imageRequired: string
}

const isApplicationUrl = (value: string) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const optionalDate = (message: string) =>
  yup
    .string()
    .defined()
    .test('valid-date', message, (value) => !value || !Number.isNaN(Date.parse(value)))

export function createBannerSchema(mode: 'create' | 'edit', hasExistingImage: boolean, messages: Messages) {
  return yup.object<BannerFormValues>({
    title: yup.object({
      ar: yup.string().trim().required(messages.titleArRequired),
      en: yup.string().trim().required(messages.titleEnRequired),
    }),
    placement: yup.mixed<BannerPlacement>().oneOf(['home', 'splash']).required(messages.placementRequired),
    platform: yup.mixed<BannerPlatform>().oneOf(['web', 'mobile', 'both']).required(messages.platformRequired),
    link_url: yup
      .string()
      .trim()
      .defined()
      .test('application-url', messages.linkInvalid, (value) => !value || isApplicationUrl(value)),
    starts_at: optionalDate(messages.dateInvalid),
    ends_at: optionalDate(messages.dateInvalid).test('after-start', messages.endBeforeStart, function (value) {
      const start = this.parent.starts_at as string
      return !value || !start || new Date(value).getTime() >= new Date(start).getTime()
    }),
    is_active: yup.boolean().defined(),
    sort_order: yup
      .number()
      .typeError(messages.sortRequired)
      .required(messages.sortRequired)
      .integer(messages.sortInteger)
      .min(0, messages.sortNonNegative),
    image: yup
      .mixed<ImageUploadValue>()
      .defined()
      .test('required-image', messages.imageRequired, (value) => {
        if (value.files.length > 0) return true
        return mode === 'edit' && hasExistingImage && value.removedExistingIds.length === 0
      }),
  })
}
