import { useMemo, type BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormImageUploader, FormInput, FormSortOrder, FormTextArea } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import { createTestimonialSchema } from '@/modules/testimonials/schemas/testimonial.schema'
import type { Testimonial, TestimonialFormValues } from '@/modules/testimonials/types/testimonial.types'
import { getLocalizedTestimonialValue } from '@/modules/testimonials/utils/testimonial.utils'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type TestimonialSubmitIntent = 'create' | 'create-another' | 'edit'

export const EMPTY_TESTIMONIAL_FORM_VALUES: TestimonialFormValues = {
  name: { ar: '', en: '' },
  title: { ar: '', en: '' },
  comment: { ar: '', en: '' },
  rating: null,
  sortOrder: 0,
  isPublished: true,
  avatar: EMPTY_IMAGE_UPLOAD_VALUE,
}

type Props = {
  formId: string
  mode: 'create' | 'edit'
  testimonial: Testimonial | null
  initialValues: TestimonialFormValues
  isSubmitting: boolean
  onFormStateChange: (state: { isDirty: boolean; isValid: boolean }) => void
  onSubmit: (
    values: TestimonialFormValues,
    intent: TestimonialSubmitIntent,
    methods: UseFormReturn<TestimonialFormValues>
  ) => void | Promise<void>
}

export function TestimonialForm({
  formId,
  mode,
  testimonial,
  initialValues,
  isSubmitting,
  onFormStateChange,
  onSubmit,
}: Props) {
  const { t, i18n } = useTranslation()
  const schema = useMemo(
    () =>
      createTestimonialSchema({
        required: t('testimonials.validation.required'),
        validNumber: t('testimonials.validation.validNumber'),
        integer: t('testimonials.validation.integer'),
      }),
    [t]
  )
  const avatarName = testimonial ? getLocalizedTestimonialValue(testimonial.name, i18n.language) : ''
  const existingImages = testimonial?.avatarUrl
    ? [{ id: testimonial.id, url: testimonial.avatarUrl, alt: t('testimonials.avatar.alt', { name: avatarName }) }]
    : []

  const handleSubmit = async (
    values: TestimonialFormValues,
    methods: UseFormReturn<TestimonialFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
    const intent = (submitter?.dataset.submitIntent ?? mode) as TestimonialSubmitIntent
    try {
      await onSubmit(values, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        'name.ar': 'name.ar',
        'name[ar]': 'name.ar',
        'name.en': 'name.en',
        'name[en]': 'name.en',
        'title.ar': 'title.ar',
        'title[ar]': 'title.ar',
        'title.en': 'title.en',
        'title[en]': 'title.en',
        'comment.ar': 'comment.ar',
        'comment[ar]': 'comment.ar',
        'comment.en': 'comment.en',
        'comment[en]': 'comment.en',
        rating: 'rating',
        sort_order: 'sortOrder',
        is_published: 'isPublished',
        avatar: 'avatar',
      })
    }
  }

  return (
    <FormWrapper<TestimonialFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={`${mode}-${testimonial?.id ?? 'new'}`}
      formId={formId}
      className="space-y-6"
      submissionDisabled={isSubmitting}
      validationMode="onChange"
      onFormStateChange={onFormStateChange}
      onSubmit={handleSubmit}
    >
      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="testimonial-basic-title"
      >
        <h2 id="testimonial-basic-title" className="font-semibold text-foreground">
          {t('testimonials.sections.basic')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="name.ar"
            label={t('testimonials.fields.nameAr')}
            dir="rtl"
            required
            autoFocus
            disabled={isSubmitting}
          />
          <FormInput
            name="name.en"
            label={t('testimonials.fields.nameEn')}
            dir="ltr"
            required
            disabled={isSubmitting}
          />
          <FormInput
            name="title.ar"
            label={t('testimonials.fields.titleAr')}
            dir="rtl"
            required
            disabled={isSubmitting}
          />
          <FormInput
            name="title.en"
            label={t('testimonials.fields.titleEn')}
            dir="ltr"
            required
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="testimonial-comment-title"
      >
        <h2 id="testimonial-comment-title" className="font-semibold text-foreground">
          {t('testimonials.sections.comment')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormTextArea
            name="comment.ar"
            label={t('testimonials.fields.commentAr')}
            dir="rtl"
            required
            disabled={isSubmitting}
          />
          <FormTextArea
            name="comment.en"
            label={t('testimonials.fields.commentEn')}
            dir="ltr"
            required
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="testimonial-settings-title"
      >
        <h2 id="testimonial-settings-title" className="font-semibold text-foreground">
          {t('testimonials.sections.settings')}
        </h2>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <FormInput
            name="rating"
            label={t('testimonials.fields.rating')}
            type="number"
            inputMode="decimal"
            step="any"
            dir="ltr"
            required
            disabled={isSubmitting}
          />
          <FormSortOrder name="sortOrder" label={t('testimonials.fields.sortOrder')} required disabled={isSubmitting} />
        </div>
        <FormSwitch name="isPublished" label={t('testimonials.fields.published')} disabled={isSubmitting} />
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="testimonial-avatar-title"
      >
        <h2 id="testimonial-avatar-title" className="font-semibold text-foreground">
          {t('testimonials.sections.avatar')}
        </h2>
        <FormImageUploader<TestimonialFormValues>
          name="avatar"
          label={t('testimonials.fields.avatar')}
          mode="single"
          accept="image/*"
          existingImages={existingImages}
          allowExistingRemoval={false}
          previewFit="cover"
          disabled={isSubmitting}
        />
        {testimonial?.avatarUrl ? (
          <p className="text-xs text-muted-foreground">{t('testimonials.avatar.replacementOnly')}</p>
        ) : null}
      </section>
    </FormWrapper>
  )
}
