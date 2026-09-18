import { useMemo, type BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormInput, FormSortOrder } from '@/components/form'
import { createRegionSchema } from '@/modules/regions/schemas/region.schema'
import type { RegionFormValues, RegionPayload } from '@/modules/regions/types/region.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type RegionSubmitIntent = 'create' | 'create-another' | 'edit'
export const EMPTY_REGION_FORM_VALUES: RegionFormValues = {
  name: { ar: '', en: '' },
  code: '',
  sortOrder: null,
  isActive: true,
}

type Props = {
  formId: string
  initialValues: RegionFormValues
  resetValuesKey: string | number
  isSubmitting: boolean
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (
    values: RegionPayload,
    intent: RegionSubmitIntent,
    methods: UseFormReturn<RegionFormValues>
  ) => void | Promise<void>
}

export function RegionForm({ formId, initialValues, resetValuesKey, isSubmitting, onDirtyChange, onSubmit }: Props) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      createRegionSchema({
        nameArRequired: t('regions.validation.nameArRequired'),
        nameEnRequired: t('regions.validation.nameEnRequired'),
        sortInteger: t('regions.validation.sortInteger'),
      }),
    [t]
  )
  const handleSubmit = async (
    values: RegionFormValues,
    methods: UseFormReturn<RegionFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
    const intent = (submitter?.dataset.submitIntent ?? 'create') as RegionSubmitIntent
    try {
      await onSubmit(
        {
          name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
          code: values.code.trim() || undefined,
          sortOrder: values.sortOrder ?? undefined,
          isActive: values.isActive,
        },
        intent,
        methods
      )
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        'name[ar]': 'name.ar',
        'name[en]': 'name.en',
        code: 'code',
        sort_order: 'sortOrder',
        is_active: 'isActive',
      })
    }
  }

  return (
    <FormWrapper<RegionFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={resetValuesKey}
      formId={formId}
      className="space-y-5"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          name="name.ar"
          label={t('regions.fields.nameAr')}
          dir="rtl"
          required
          autoFocus
          disabled={isSubmitting}
        />
        <FormInput name="name.en" label={t('regions.fields.nameEn')} dir="ltr" required disabled={isSubmitting} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput name="code" label={t('regions.fields.code')} dir="ltr" disabled={isSubmitting} />
        <FormSortOrder name="sortOrder" label={t('regions.fields.sortOrder')} disabled={isSubmitting} />
      </div>
      <FormCheckbox name="isActive" label={t('regions.fields.active')} disabled={isSubmitting} />
    </FormWrapper>
  )
}
