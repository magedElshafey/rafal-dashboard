import { useCallback, useMemo, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import {
  EMPTY_TESTIMONIAL_FORM_VALUES,
  TestimonialForm,
  type TestimonialSubmitIntent,
} from '@/modules/testimonials/components/TestimonialForm'
import { useCreateTestimonial } from '@/modules/testimonials/hooks/useCreateTestimonial'
import { useUpdateTestimonial } from '@/modules/testimonials/hooks/useUpdateTestimonial'
import type { Testimonial, TestimonialFormValues } from '@/modules/testimonials/types/testimonial.types'
import { buildTestimonialPayload, toTestimonialFormValues } from '@/modules/testimonials/utils/testimonial.utils'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  testimonial: Testimonial | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'testimonial-form'

export function TestimonialDrawer({ open, mode, testimonial, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const lockRef = useRef(false)
  const createTestimonial = useCreateTestimonial()
  const updateTestimonial = useUpdateTestimonial(testimonial?.id ?? null)
  const isSubmitting = createTestimonial.isPending || updateTestimonial.isPending
  const isReady = mode === 'create' || testimonial !== null
  const initialValues = useMemo(
    () => (mode === 'edit' && testimonial ? toTestimonialFormValues(testimonial) : EMPTY_TESTIMONIAL_FORM_VALUES),
    [mode, testimonial]
  )
  const handleFormStateChange = useCallback((state: { isDirty: boolean; isValid: boolean }) => setFormState(state), [])

  const handleSubmit = async (
    values: TestimonialFormValues,
    intent: TestimonialSubmitIntent,
    methods: UseFormReturn<TestimonialFormValues>
  ) => {
    if (lockRef.current || (mode === 'edit' && !formState.isDirty)) return
    lockRef.current = true
    try {
      const payload = buildTestimonialPayload(values)
      if (mode === 'create') {
        await createTestimonial.mutateAsync(payload)
        methods.reset(EMPTY_TESTIMONIAL_FORM_VALUES)
        if (intent === 'create-another') window.requestAnimationFrame(() => methods.setFocus('name.ar'))
        else onOpenChange(false)
      } else {
        await updateTestimonial.mutateAsync(payload)
        methods.reset(values)
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
      titles={{ create: t('testimonials.createTestimonial'), edit: t('testimonials.editTestimonial') }}
      descriptions={{
        create: t('testimonials.form.createDescription'),
        edit: t('testimonials.form.editDescription'),
      }}
      submitLabels={{ create: t('testimonials.actions.create'), edit: t('testimonials.actions.update') }}
      createAnotherLabel={t('testimonials.actions.createAnother')}
      cancelLabel={t('testimonials.actions.cancel')}
      closeLabel={t('testimonials.actions.close')}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      isSubmitDisabled={!formState.isValid || (mode === 'edit' && (!formState.isDirty || !isReady))}
    >
      {isReady ? (
        <TestimonialForm
          key={`${mode}-${testimonial?.id ?? 'new'}-${open}`}
          formId={FORM_ID}
          mode={mode}
          testimonial={testimonial}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          onFormStateChange={handleFormStateChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
