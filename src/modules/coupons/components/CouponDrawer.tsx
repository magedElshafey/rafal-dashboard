import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { CouponForm, EMPTY_COUPON_FORM_VALUES, type CouponSubmitIntent } from '@/modules/coupons/components/CouponForm'
import { useCreateCoupon } from '@/modules/coupons/hooks/useCreateCoupon'
import { useUpdateCoupon } from '@/modules/coupons/hooks/useUpdateCoupon'
import type { Coupon, CouponFormValues } from '@/modules/coupons/types/coupon.types'
import {
  buildCouponCreatePayload,
  buildCouponUpdatePayload,
  toCouponFormValues,
} from '@/modules/coupons/utils/coupon.utils'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  coupon: Coupon | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'coupon-form'

export function CouponDrawer({ open, mode, coupon, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const lockRef = useRef(false)
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon(coupon?.id ?? null)
  const isSubmitting = createCoupon.isPending || updateCoupon.isPending
  const isReady = mode === 'create' || coupon !== null
  const initialValues = useMemo(
    () => (mode === 'edit' && coupon ? toCouponFormValues(coupon) : EMPTY_COUPON_FORM_VALUES),
    [mode, coupon]
  )
  const handleFormStateChange = useCallback((state: { isDirty: boolean; isValid: boolean }) => setFormState(state), [])

  const handleSubmit = async (
    values: CouponFormValues,
    intent: CouponSubmitIntent,
    methods: UseFormReturn<CouponFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && !formState.isDirty)) return
    lockRef.current = true
    try {
      if (mode === 'create') {
        await createCoupon.mutateAsync(buildCouponCreatePayload(values))
        methods.reset(EMPTY_COUPON_FORM_VALUES)
        if (intent === 'create-another') window.requestAnimationFrame(() => methods.setFocus('code'))
        else onOpenChange(false)
      } else {
        const response = await updateCoupon.mutateAsync(buildCouponUpdatePayload(values, methods.formState.dirtyFields))
        methods.reset(toCouponFormValues(response.data))
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
      titles={{ create: t('coupons.createCoupon'), edit: t('coupons.editCoupon') }}
      descriptions={{ create: t('coupons.form.createDescription'), edit: t('coupons.form.editDescription') }}
      submitLabels={{ create: t('coupons.actions.create'), edit: t('coupons.actions.update') }}
      createAnotherLabel={t('coupons.actions.createAnother')}
      cancelLabel={t('coupons.actions.cancel')}
      closeLabel={t('coupons.actions.close')}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      isSubmitDisabled={!formState.isValid || (mode === 'edit' && (!formState.isDirty || !isReady))}
    >
      {isReady ? (
        <CouponForm
          key={`${mode}-${coupon?.id ?? 'new'}-${open}`}
          formId={FORM_ID}
          initialValues={initialValues}
          resetValuesKey={`${mode}-${coupon?.id ?? 'new'}`}
          isSubmitting={isSubmitting}
          onFormStateChange={handleFormStateChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
