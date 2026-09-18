import { useMemo, type BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormInput } from '@/components/form/FormInput'
import { FormTagsInput } from '@/components/form/FormTagsInput'
import { FormWrapper } from '@/components/core/FormWrapper'
import { createWarehouseSchema } from '@/modules/warehouses/schemas/warehouse.schema'
import type { WarehouseFormValues } from '@/modules/warehouses/types/warehouse.types'

export type WarehouseSubmitIntent = 'create' | 'create-another' | 'edit'
export const EMPTY_WAREHOUSE_FORM_VALUES: WarehouseFormValues = { name: '', coverageZone: [], isActive: true }

type WarehouseFormProps = {
  formId: string
  initialValues: WarehouseFormValues
  resetValuesKey: string | number
  isSubmitting: boolean
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (
    values: WarehouseFormValues,
    intent: WarehouseSubmitIntent,
    methods: UseFormReturn<WarehouseFormValues>
  ) => void | Promise<void>
}

export function WarehouseForm({
  formId,
  initialValues,
  resetValuesKey,
  isSubmitting,
  onDirtyChange,
  onSubmit,
}: WarehouseFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createWarehouseSchema(t('warehouses.validation.nameRequired')), [t])
  const handleSubmit = (
    values: WarehouseFormValues,
    methods: UseFormReturn<WarehouseFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const intent =
      (event?.nativeEvent as SubmitEvent | undefined)?.submitter instanceof HTMLElement
        ? (((event?.nativeEvent as SubmitEvent).submitter as HTMLElement).dataset.submitIntent as WarehouseSubmitIntent)
        : 'create'
    return onSubmit(
      {
        ...values,
        name: values.name.trim(),
        coverageZone: values.coverageZone.map((item) => item.trim()).filter(Boolean),
      },
      intent,
      methods
    )
  }
  return (
    <FormWrapper<WarehouseFormValues>
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
      <FormInput name="name" label={t('warehouses.fields.name')} required autoFocus disabled={isSubmitting} />
      <FormTagsInput
        name="coverageZone"
        label={t('warehouses.fields.coverageZones')}
        placeholder={t('warehouses.fields.addCoverageZone')}
        addLabel={t('warehouses.fields.addCoverageZone')}
        removeLabel={(value) => t('warehouses.fields.removeCoverageZone', { value })}
        disabled={isSubmitting}
      />
      <FormCheckbox name="isActive" label={t('warehouses.fields.active')} disabled={isSubmitting} />
    </FormWrapper>
  )
}
