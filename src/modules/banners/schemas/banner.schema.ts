import * as yup from 'yup'

import type { ImageUploadValue } from '@/components/form/image-upload'
import { bannerPositions, type BannerDestinationType, type BannerFormValues, type BannerPlatform, type BannerPosition } from '@/modules/banners/types/banner.types'

type Messages = {
  titleArRequired: string
  titleEnRequired: string
  platformRequired: string
  positionRequired: string
  destinationRequired: string
  dateInvalid: string
  endBeforeStart: string
  sortRequired: string
  sortInteger: string
  sortNonNegative: string
  imageRequired: string
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
    platform: yup.mixed<BannerPlatform>().oneOf(['web', 'mobile', 'both']).required(messages.platformRequired),
    position: yup.mixed<BannerPosition>().oneOf([...bannerPositions], messages.positionRequired).required(messages.positionRequired),
    destination_type: yup.mixed<BannerDestinationType>().oneOf(['product', 'category'], messages.destinationRequired).required(messages.destinationRequired),
    product_id: yup.number().nullable().defined().typeError(messages.destinationRequired).test('product-destination', messages.destinationRequired, function (value) {
      return this.parent.destination_type === 'product' ? Number.isSafeInteger(value) && Number(value) > 0 && this.parent.category_id === null : value === null
    }),
    category_id: yup.number().nullable().defined().typeError(messages.destinationRequired).test('category-destination', messages.destinationRequired, function (value) {
      return this.parent.destination_type === 'category' ? Number.isSafeInteger(value) && Number(value) > 0 && this.parent.product_id === null : value === null
    }),
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
