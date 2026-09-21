import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import {
  EMPTY_SHIPPING_METHOD_FORM_VALUES,
  ShippingMethodForm,
  type ShippingMethodSubmitIntent,
} from '@/modules/shipping-methods/components/ShippingMethodForm'
import { useCreateShippingMethod } from '@/modules/shipping-methods/hooks/useCreateShippingMethod'
import { useUpdateShippingMethod } from '@/modules/shipping-methods/hooks/useUpdateShippingMethod'
import type { ShippingMethod, ShippingMethodFormValues } from '@/modules/shipping-methods/types/shipping-method.types'
import {
  buildShippingMethodUpdatePayload,
  toShippingMethodFormValues,
} from '@/modules/shipping-methods/utils/shipping-method.utils'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  shippingMethod: ShippingMethod | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'shipping-method-form'

export function ShippingMethodDrawer({ open, mode, shippingMethod, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const lockRef = useRef(false)
  const createShippingMethod = useCreateShippingMethod()
  const updateShippingMethod = useUpdateShippingMethod(shippingMethod?.id ?? null)
  const isSubmitting = createShippingMethod.isPending || updateShippingMethod.isPending
  const isReady = mode === 'create' || shippingMethod !== null
  const initialValues = useMemo(
    () =>
      mode === 'edit' && shippingMethod
        ? toShippingMethodFormValues(shippingMethod)
        : EMPTY_SHIPPING_METHOD_FORM_VALUES,
    [mode, shippingMethod]
  )
  const handleFormStateChange = useCallback((state: { isDirty: boolean; isValid: boolean }) => setFormState(state), [])

  const handleSubmit = async (
    values: ShippingMethodFormValues,
    intent: ShippingMethodSubmitIntent,
    methods: UseFormReturn<ShippingMethodFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && !formState.isDirty)) return
    lockRef.current = true
    try {
      if (mode === 'create') {
        await createShippingMethod.mutateAsync(values)
        methods.reset(EMPTY_SHIPPING_METHOD_FORM_VALUES)
        if (intent === 'create-another') window.requestAnimationFrame(() => methods.setFocus('code'))
        else onOpenChange(false)
      } else {
        const payload = buildShippingMethodUpdatePayload(values, methods.formState.dirtyFields)
        const response = await updateShippingMethod.mutateAsync(payload)
        methods.reset(toShippingMethodFormValues(response.data))
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
      titles={{
        create: t('shippingMethods.createShippingMethod'),
        edit: t('shippingMethods.editShippingMethod'),
      }}
      descriptions={{
        create: t('shippingMethods.form.createDescription'),
        edit: t('shippingMethods.form.editDescription'),
      }}
      submitLabels={{ create: t('shippingMethods.actions.create'), edit: t('shippingMethods.actions.update') }}
      createAnotherLabel={t('shippingMethods.actions.createAnother')}
      cancelLabel={t('shippingMethods.actions.cancel')}
      closeLabel={t('shippingMethods.actions.close')}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      isSubmitDisabled={!formState.isValid || (mode === 'edit' && (!formState.isDirty || !isReady))}
    >
      {isReady ? (
        <ShippingMethodForm
          key={`${mode}-${shippingMethod?.id ?? 'new'}-${open}`}
          mode={mode}
          formId={FORM_ID}
          initialValues={initialValues}
          resetValuesKey={`${mode}-${shippingMethod?.id ?? 'new'}`}
          isSubmitting={isSubmitting}
          onFormStateChange={handleFormStateChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
