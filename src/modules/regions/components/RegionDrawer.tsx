import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { EMPTY_REGION_FORM_VALUES, RegionForm, type RegionSubmitIntent } from './RegionForm'
import { useCreateRegion } from '@/modules/regions/hooks/useCreateRegion'
import { useUpdateRegion } from '@/modules/regions/hooks/useUpdateRegion'
import type { Region, RegionFormValues, RegionPayload } from '@/modules/regions/types/region.types'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  region: Region | null
  onOpenChange: (open: boolean) => void
}
const FORM_ID = 'region-form'

function toFormValues(region: Region): RegionFormValues {
  return {
    name: { ...region.name },
    code: region.code ?? '',
    sortOrder: region.sort_order,
    isActive: region.is_active,
  }
}

export function RegionDrawer({ open, mode, region, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const lockRef = useRef(false)
  const createRegion = useCreateRegion()
  const updateRegion = useUpdateRegion(region?.id ?? null)
  const isSubmitting = createRegion.isPending || updateRegion.isPending
  const isReady = mode === 'create' || region !== null
  const initialValues = useMemo(
    () => (mode === 'edit' && region ? toFormValues(region) : EMPTY_REGION_FORM_VALUES),
    [mode, region]
  )
  const onDirtyChange = useCallback((value: boolean) => setIsDirty(value), [])

  const handleSubmit = async (
    values: RegionPayload,
    intent: RegionSubmitIntent,
    methods: UseFormReturn<RegionFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && !isDirty)) return
    lockRef.current = true
    try {
      if (mode === 'create') {
        await createRegion.mutateAsync(values)
        methods.reset(EMPTY_REGION_FORM_VALUES)
        if (intent === 'create-another') window.requestAnimationFrame(() => methods.setFocus('name.ar'))
        else onOpenChange(false)
      } else {
        const response = await updateRegion.mutateAsync(values)
        methods.reset(toFormValues(response.data))
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
      titles={{ create: t('regions.createRegion'), edit: t('regions.editRegion') }}
      descriptions={{ create: t('regions.form.createDescription'), edit: t('regions.form.editDescription') }}
      submitLabels={{ create: t('regions.actions.create'), edit: t('regions.actions.update') }}
      createAnotherLabel={t('regions.actions.createAnother')}
      cancelLabel={t('regions.actions.cancel')}
      closeLabel={t('regions.actions.close')}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isReady)}
    >
      {isReady ? (
        <RegionForm
          key={`${mode}-${region?.id ?? 'new'}-${open}`}
          formId={FORM_ID}
          initialValues={initialValues}
          resetValuesKey={`${mode}-${region?.id ?? 'new'}`}
          isSubmitting={isSubmitting}
          onDirtyChange={onDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
