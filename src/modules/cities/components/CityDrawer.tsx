import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { CityForm, createEmptyCityFormValues, type CitySubmitIntent } from '@/modules/cities/components/CityForm'
import { useCreateCity } from '@/modules/cities/hooks/useCreateCity'
import { useUpdateCity } from '@/modules/cities/hooks/useUpdateCity'
import type { City, CityFormValues, CityPayload, CityUpdatePayload } from '@/modules/cities/types/city.types'
import { openBoundaryRing } from '@/modules/cities/utils/city.utils'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  city: City | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'city-form'

export function toCityFormValues(city: City): CityFormValues {
  return {
    regionId: city.region_id,
    name: { ...city.name },
    sortOrder: city.sort_order,
    isActive: city.is_active,
    boundary: openBoundaryRing(city.boundary),
    center: city.center ? { ...city.center } : null,
  }
}

function toCityUpdatePayload(values: CityFormValues, methods: UseFormReturn<CityFormValues>): CityUpdatePayload {
  const payload: CityUpdatePayload = {}
  if (methods.getFieldState('regionId').isDirty && values.regionId !== null) payload.regionId = values.regionId
  if (methods.getFieldState('name.ar').isDirty) payload.nameAr = values.name.ar
  if (methods.getFieldState('name.en').isDirty) payload.nameEn = values.name.en
  if (methods.getFieldState('sortOrder').isDirty) payload.sortOrder = values.sortOrder
  if (methods.getFieldState('isActive').isDirty) payload.isActive = values.isActive
  if (methods.getFieldState('center').isDirty && values.center) payload.center = { ...values.center }
  if (methods.getFieldState('boundary').isDirty) {
    payload.boundary = values.boundary.map((point) => ({ ...point }))
  }
  return payload
}

export function CityDrawer({ open, mode, city, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [resetKey, setResetKey] = useState(0)
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const lockRef = useRef(false)
  const createCity = useCreateCity()
  const updateCity = useUpdateCity(city?.id ?? null)
  const isSubmitting = createCity.isPending || updateCity.isPending
  const isReady = mode === 'create' || city !== null
  const initialValues = useMemo(
    () => (mode === 'edit' && city ? toCityFormValues(city) : createEmptyCityFormValues()),
    [city, mode]
  )
  const onFormStateChange = useCallback((value: { isDirty: boolean; isValid: boolean }) => setFormState(value), [])

  const handleSubmit = async (
    values: CityPayload,
    intent: CitySubmitIntent,
    methods: UseFormReturn<CityFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && (!formState.isDirty || !formState.isValid))) return
    lockRef.current = true
    try {
      if (mode === 'create') {
        await createCity.mutateAsync(values)
        const emptyValues = createEmptyCityFormValues()
        methods.reset(emptyValues)
        if (intent === 'create-another') {
          setResetKey((key) => key + 1)
          window.requestAnimationFrame(() => methods.setFocus('regionId'))
        } else {
          onOpenChange(false)
        }
      } else {
        const response = await updateCity.mutateAsync(toCityUpdatePayload(values, methods))
        methods.reset(toCityFormValues(response.data))
        onOpenChange(false)
      }
    } finally {
      lockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('cities.createCity'), edit: t('cities.editCity') }}
      descriptions={{
        create: t('cities.form.createDescription'),
        edit: t('cities.form.editDescription'),
      }}
      submitLabels={{ create: t('cities.actions.create'), edit: t('cities.actions.update') }}
      createAnotherLabel={t('cities.actions.createAnother')}
      cancelLabel={t('cities.actions.cancel')}
      closeLabel={t('cities.actions.close')}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!formState.isDirty || !formState.isValid || !isReady)}
      className="sm:max-w-[min(92vw,64rem)] lg:max-w-5xl"
    >
      {isReady ? (
        <CityForm
          key={`${mode}-${city?.id ?? 'new'}-${open}`}
          formId={FORM_ID}
          initialValues={initialValues}
          resetValuesKey={`${mode}-${city?.id ?? 'new'}-${resetKey}`}
          isSubmitting={isSubmitting}
          onFormStateChange={onFormStateChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
