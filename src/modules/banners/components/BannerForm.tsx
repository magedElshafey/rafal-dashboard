import type { BaseSyntheticEvent } from 'react'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormImageUploader, FormInput, FormSelect, FormSortOrder } from '@/components/form'
import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import { createBannerSchema } from '@/modules/banners/schemas/banner.schema'
import type { Banner, BannerFormValues } from '@/modules/banners/types/banner.types'
import { getBannerDestinationType, toDateTimeLocal } from '@/modules/banners/utils/banner.utils'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

import { BannerDestinationFields } from './BannerDestinationFields'
import { bannerPositions } from '../types/banner.types'

export type BannerSubmitIntent = 'create' | 'create-another' | 'edit'

type BannerFormProps = {
  formId: string
  mode: 'create' | 'edit'
  banner?: Banner
  isSubmitting: boolean
  onDirtyChange: (isDirty: boolean) => void
  onSubmit: (
    values: BannerFormValues,
    intent: BannerSubmitIntent,
    methods: UseFormReturn<BannerFormValues>
  ) => Promise<void>
}

export const EMPTY_BANNER_FORM_VALUES: BannerFormValues = {
  title: { ar: '', en: '' },
  platform: 'both',
  position: '',
  destination_type: 'product',
  product_id: null,
  category_id: null,
  starts_at: '',
  ends_at: '',
  is_active: true,
  sort_order: 0,
  image: EMPTY_IMAGE_UPLOAD_VALUE,
}

const platformOptions = [
  { value: 'web', labelKey: 'banners.platforms.web' },
  { value: 'mobile', labelKey: 'banners.platforms.mobile' },
  { value: 'both', labelKey: 'banners.platforms.both' },
]

export function BannerForm({ formId, mode, banner, isSubmitting, onDirtyChange, onSubmit }: BannerFormProps) {
  const { t, i18n } = useTranslation()
  const schema = useMemo(
    () =>
      createBannerSchema(mode, Boolean(banner?.image_url), {
        titleArRequired: t('banners.validation.titleArRequired'),
        titleEnRequired: t('banners.validation.titleEnRequired'),
        platformRequired: t('banners.validation.platformRequired'),
        positionRequired: t('banners.validation.positionRequired'),
        destinationRequired: t('banners.validation.destinationRequired'),
        dateInvalid: t('banners.validation.dateInvalid'),
        endBeforeStart: t('banners.validation.endBeforeStart'),
        sortRequired: t('banners.validation.sortRequired'),
        sortInteger: t('banners.validation.sortInteger'),
        sortNonNegative: t('banners.validation.sortNonNegative'),
        imageRequired: t('banners.validation.imageRequired'),
      }),
    [banner?.image_url, mode, t]
  )
  const resetValues = useMemo<BannerFormValues>(
    () =>
      banner
        ? {
            title: { ...banner.title },
            platform: banner.platform,
            position: banner.position ?? '',
            destination_type: getBannerDestinationType(banner),
            product_id: banner.product_id,
            category_id: banner.category_id,
            starts_at: toDateTimeLocal(banner.starts_at),
            ends_at: toDateTimeLocal(banner.ends_at),
            is_active: banner.is_active,
            sort_order: banner.sort_order,
            image: { files: [], removedExistingIds: [] },
          }
        : EMPTY_BANNER_FORM_VALUES,
    [banner]
  )
  const localizedPlatforms = platformOptions.map((option) => ({ ...option, label: t(option.labelKey) }))
  const primaryTitle = banner?.title[i18n.language.startsWith('ar') ? 'ar' : 'en']

  const handleSubmit = async (
    values: BannerFormValues,
    methods: UseFormReturn<BannerFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? mode) as BannerSubmitIntent
    const normalized: BannerFormValues = {
      ...values,
      title: { ar: values.title.ar.trim(), en: values.title.en.trim() },
      starts_at: values.starts_at.trim(),
      ends_at: values.ends_at.trim(),
    }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        'title[ar]': 'title.ar',
        'title[en]': 'title.en',
        starts_at: 'starts_at',
        ends_at: 'ends_at',
        sort_order: 'sort_order',
        image: 'image',
      })
    }
  }

  return (
    <FormWrapper<BannerFormValues>
      schema={schema}
      defaultValues={resetValues}
      resetValues={resetValues}
      resetValuesKey={banner?.id ?? 'create'}
      formId={formId}
      className="space-y-7"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 grid-cols-1">
        <FormInput name="title.ar" label={t('banners.fields.titleAr')} dir="rtl" required autoFocus />
        <FormInput name="title.en" label={t('banners.fields.titleEn')} dir="ltr" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormSelect
          name="platform"
          label={t('banners.fields.platform')}
          data={localizedPlatforms}
          valueKey="value"
          labelKey="label"
          disabled={isSubmitting}
          required
        />
      </div>
      <FormSelect name="position" label={t('banners.fields.position')}
        data={bannerPositions.map(value => ({ value, label: t(`banners.positions.${value}`) }))}
        valueKey="value" labelKey="label" disabled={isSubmitting} required />
      <BannerDestinationFields disabled={isSubmitting} />
      <div className="grid gap-5 grid-cols-1">
        <FormInput name="starts_at" label={t('banners.fields.startsAt')} type="datetime-local" dir="ltr" />
        <FormInput name="ends_at" label={t('banners.fields.endsAt')} type="datetime-local" dir="ltr" />
      </div>

      <FormSortOrder name="sort_order" label={t('banners.fields.sortOrder')} min={0} disabled={isSubmitting} required />

      <FormImageUploader<BannerFormValues>
        name="image"
        label={t('banners.fields.image')}
        mode="single"
        accept="image/*"
        maxFileSize={5 * 1024 * 1024}
        existingImages={banner ? [{ id: banner.id, url: banner.image_url, alt: primaryTitle }] : []}
        previewFit="contain"
        disabled={isSubmitting}
        required
      />

      <FormCheckbox name="is_active" label={t('banners.fields.active')} disabled={isSubmitting} />
    </FormWrapper>
  )
}
