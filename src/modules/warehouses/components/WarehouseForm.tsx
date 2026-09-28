import { useMemo, type BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormInput } from '@/components/form/FormInput'
import { FormMultiSelect } from '@/components/form/FormMultiSelect'
import { useCities } from '@/modules/cities/hooks/useCities'
import { getLocalizedName } from '@/modules/cities/utils/city.utils'
import { createWarehouseSchema } from '@/modules/warehouses/schemas/warehouse.schema'
import type { WarehouseCity, WarehouseFormValues } from '@/modules/warehouses/types/warehouse.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type WarehouseSubmitIntent = 'create' | 'create-another' | 'edit'
export const EMPTY_WAREHOUSE_FORM_VALUES: WarehouseFormValues = { name: '', cityIds: [], isActive: true }

type WarehouseFormProps = {
  formId: string
  mode: 'create' | 'edit'
  initialValues: WarehouseFormValues
  initialCities: WarehouseCity[]
  resetValuesKey: string | number
  isSubmitting: boolean
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (
    values: WarehouseFormValues,
    intent: WarehouseSubmitIntent,
    methods: UseFormReturn<WarehouseFormValues>
  ) => void | Promise<void>
}

type CityOption = { id: number; label: string }

export function WarehouseForm({
  formId,
  mode,
  initialValues,
  initialCities,
  resetValuesKey,
  isSubmitting,
  onDirtyChange,
  onSubmit,
}: WarehouseFormProps) {
  const { t, i18n } = useTranslation()
  const citiesQuery = useCities()
  const loadedCities = useMemo(() => citiesQuery.data?.pages.flatMap((page) => page.items) ?? [], [citiesQuery.data])
  const cityOptions = useMemo<CityOption[]>(() => {
    const options = new Map<number, CityOption>()
    initialCities.forEach((city) => {
      options.set(city.id, { id: city.id, label: getLocalizedName(city.name, i18n.language) })
    })
    loadedCities.forEach((city) => {
      options.set(city.id, { id: city.id, label: getLocalizedName(city.name, i18n.language) })
    })
    return [...options.values()]
  }, [i18n.language, initialCities, loadedCities])
  const schema = useMemo(
    () =>
      createWarehouseSchema(mode, t('warehouses.validation.nameRequired'), t('warehouses.validation.citiesRequired')),
    [mode, t]
  )

  const handleSubmit = async (
    values: WarehouseFormValues,
    methods: UseFormReturn<WarehouseFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? mode) as WarehouseSubmitIntent
    const normalized = {
      ...values,
      name: values.name.trim(),
      cityIds: [...new Set(values.cityIds)],
    }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, { city_ids: 'cityIds' })
    }
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
      <FormMultiSelect<CityOption, WarehouseFormValues>
        name="cityIds"
        label={t('warehouses.fields.cities')}
        data={cityOptions}
        valueKey="id"
        labelKey="label"
        placeholder={t('warehouses.form.citiesPlaceholder')}
        searchable={false}
        showSelectAll={false}
        maxCount={2}
        required={mode === 'create'}
        disabled={isSubmitting}
        isLoading={citiesQuery.isLoading}
        isFetchingNextPage={citiesQuery.isFetchingNextPage}
        isError={citiesQuery.isError}
        isRetrying={citiesQuery.isFetching}
        hasNextPage={citiesQuery.hasNextPage}
        onLoadMore={citiesQuery.fetchNextPage}
        onRetry={citiesQuery.refetch}
        emptyMessage={t('warehouses.form.citiesEmpty')}
        loadingMessage={t('warehouses.form.citiesLoading')}
        loadMoreMessage={t('warehouses.form.citiesLoadMore')}
        errorMessage={t('warehouses.form.citiesError')}
        retryLabel={t('warehouses.form.citiesRetry')}
        clearLabel={t('warehouses.form.citiesClear')}
      />
      <FormCheckbox name="isActive" label={t('warehouses.fields.active')} disabled={isSubmitting} />
    </FormWrapper>
  )
}
