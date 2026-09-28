import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { WarehouseForm, EMPTY_WAREHOUSE_FORM_VALUES, type WarehouseSubmitIntent } from './WarehouseForm'
import { WarehouseFormSkeleton } from './WarehouseFormSkeleton'
import { useWarehouse } from '@/modules/warehouses/hooks/useWarehouse'
import { useCreateWarehouse } from '@/modules/warehouses/hooks/useCreateWarehouse'
import { useUpdateWarehouse } from '@/modules/warehouses/hooks/useUpdateWarehouse'
import type { WarehouseDetail, WarehouseFormValues } from '@/modules/warehouses/types/warehouse.types'
import { buildWarehouseCreatePayload, buildWarehouseUpdatePayload } from '@/modules/warehouses/utils/warehouse.utils'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  warehouseId: number | null
  onOpenChange: (open: boolean) => void
}
const FORM_ID = 'warehouse-form'

function toFormValues(warehouse: WarehouseDetail): WarehouseFormValues {
  return {
    name: warehouse.name,
    cityIds: warehouse.cities.map((city) => String(city.id)),
    isActive: warehouse.isActive,
  }
}

export function WarehouseDrawer({ open, mode, warehouseId, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const lockRef = useRef(false)
  const detail = useWarehouse(warehouseId, open && mode === 'edit')
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse(warehouseId)
  const isSubmitting = createWarehouse.isPending || updateWarehouse.isPending
  const isDetailLoading = mode === 'edit' && detail.isFetching && !detail.isError
  const isDetailReady = mode === 'create' || detail.isSuccess
  const initialValues = useMemo(
    () => (mode === 'edit' && detail.data ? toFormValues(detail.data.data) : EMPTY_WAREHOUSE_FORM_VALUES),
    [detail.data, mode]
  )
  const onDirtyChange = useCallback((value: boolean) => setIsDirty(value), [])

  const handleSubmit = async (
    values: WarehouseFormValues,
    intent: WarehouseSubmitIntent,
    methods: UseFormReturn<WarehouseFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && !isDirty)) return
    lockRef.current = true
    try {
      if (mode === 'create') {
        await createWarehouse.mutateAsync(buildWarehouseCreatePayload(values))
        methods.reset(EMPTY_WAREHOUSE_FORM_VALUES)
        if (intent === 'create-another') {
          window.requestAnimationFrame(() => methods.setFocus('name'))
        } else onOpenChange(false)
      } else {
        const response = await updateWarehouse.mutateAsync(
          buildWarehouseUpdatePayload(values, methods.formState.dirtyFields)
        )
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
      titles={{ create: t('warehouses.createWarehouse'), edit: t('warehouses.editWarehouse') }}
      descriptions={{ create: t('warehouses.form.createDescription'), edit: t('warehouses.form.editDescription') }}
      submitLabels={{ create: t('warehouses.actions.create'), edit: t('warehouses.actions.update') }}
      createAnotherLabel={t('warehouses.actions.createAnother')}
      cancelLabel={t('warehouses.actions.cancel')}
      closeLabel={t('warehouses.actions.close')}
      formId={FORM_ID}
      isLoading={isDetailLoading}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isDetailReady)}
      loadingContent={<WarehouseFormSkeleton />}
      errorContent={
        mode === 'edit' && detail.isError ? (
          <QueryStateNotice kind="loading-error" isRetrying={detail.isFetching} onRetry={() => void detail.refetch()} />
        ) : undefined
      }
    >
      {isDetailReady ? (
        <WarehouseForm
          key={`${mode}-${warehouseId ?? 'new'}-${open}`}
          formId={FORM_ID}
          mode={mode}
          initialValues={initialValues}
          initialCities={mode === 'edit' && detail.data ? detail.data.data.cities : []}
          resetValuesKey={`${mode}-${warehouseId ?? 'new'}`}
          isSubmitting={isSubmitting}
          onDirtyChange={onDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
