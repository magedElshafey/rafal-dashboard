import { useRef, useState, type RefObject } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormInput, FormSelect, FormTextArea } from '@/components/form'
import { FormRadioInput } from '@/components/form/FormRadioInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdjustCustomerLoyalty } from '@/modules/loyalty/hooks/useAdjustCustomerLoyalty'
import { createLoyaltyAdjustmentSchema } from '@/modules/loyalty/schemas/loyalty-adjustment.schema'
import type {
  CustomerLoyaltySummary,
  LoyaltyAdjustmentFormValues,
  LoyaltyAdjustmentPayload,
} from '@/modules/loyalty/types/loyalty.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'

const defaultValues: LoyaltyAdjustmentFormValues = {
  type: 'credit',
  points: '',
  reason: '',
  note: '',
  notifyCustomer: false,
}

function AdjustmentFields({ pending }: { pending: boolean }) {
  const { t } = useTranslation()
  const { control } = useFormContext<LoyaltyAdjustmentFormValues>()
  const type = useWatch({ control, name: 'type' })
  const reasons = [
    { value: 'customer_service', label: t('loyalty.customer.adjustment.reasons.customerService') },
    { value: 'other', label: t('loyalty.customer.adjustment.reasons.other') },
  ]

  return (
    <>
      <FormRadioInput
        name="type"
        label={t('loyalty.customer.adjustment.fields.type')}
        options={[
          { value: 'credit', label: t('loyalty.customer.adjustment.types.credit') },
          { value: 'debit', label: t('loyalty.customer.adjustment.types.debit') },
        ]}
        disabled={pending}
      />
      <FormInput
        name="points"
        type="number"
        min={1}
        max={100000}
        step={1}
        inputMode="numeric"
        label={t('loyalty.customer.adjustment.fields.points')}
        required
        disabled={pending}
      />
      <FormSelect
        name="reason"
        data={reasons}
        valueKey="value"
        labelKey="label"
        label={t('loyalty.customer.adjustment.fields.reason')}
        placeholder={t('loyalty.customer.adjustment.reasonPlaceholder')}
        required
        disabled={pending}
      />
      <FormTextArea
        name="note"
        label={t('loyalty.customer.adjustment.fields.note')}
        minLength={10}
        maxLength={250}
        rows={4}
        required
        disabled={pending}
      />
      <FormCheckbox
        name="notifyCustomer"
        label={t('loyalty.customer.adjustment.fields.notifyCustomer')}
        disabled={pending}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {t('loyalty.customer.adjustment.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" variant={type === 'debit' ? 'destructive' : 'default'} disabled={pending}>
          {t(pending ? 'loyalty.customer.adjustment.submitting' : 'loyalty.customer.adjustment.submit')}
        </Button>
      </DialogFooter>
    </>
  )
}

export function CustomerLoyaltyAdjustmentDialog({
  customerId,
  summary,
  open,
  onOpenChange,
  triggerRef,
}: {
  customerId: number
  summary?: CustomerLoyaltySummary
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const { t, i18n } = useTranslation()
  const mutation = useAdjustCustomerLoyalty(customerId)
  const submissionLock = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const available = summary?.available ?? null
  const availableLabel =
    available === null
      ? t('loyalty.customer.adjustment.availableUnavailable')
      : new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB').format(available)
  const schema = createLoyaltyAdjustmentSchema(
    {
      required: t('loyalty.customer.adjustment.validation.required'),
      integer: t('loyalty.customer.adjustment.validation.integer'),
      pointsRange: t('loyalty.customer.adjustment.validation.pointsRange'),
      noteLength: t('loyalty.customer.adjustment.validation.noteLength'),
      insufficientBalance: t('loyalty.customer.adjustment.validation.insufficientBalance', {
        available: availableLabel,
      }),
    },
    available
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return
        setError(null)
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        dir={i18n.dir()}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('loyalty.customer.adjustment.title')}</DialogTitle>
          <DialogDescription>{t('loyalty.customer.adjustment.description')}</DialogDescription>
        </DialogHeader>
        <p className="rounded-md bg-muted p-3 text-sm">
          {t('loyalty.customer.adjustment.availableBalance', { available: availableLabel })}
        </p>
        {summary?.isBlocked ? (
          <p className="text-sm text-warning-700">{t('loyalty.customer.adjustment.frozenHint')}</p>
        ) : null}
        <FormWrapper<LoyaltyAdjustmentFormValues>
          key={String(open)}
          defaultValues={defaultValues}
          schema={schema}
          className="space-y-4"
          submissionDisabled={mutation.isPending}
          onSubmit={async (values, methods) => {
            if (submissionLock.current || mutation.isPending) return
            if (typeof values.points !== 'number' || !values.reason) return
            submissionLock.current = true
            setError(null)
            try {
              const payload: LoyaltyAdjustmentPayload = {
                type: values.type,
                points: values.points,
                reason: values.reason,
                note: values.note,
                notifyCustomer: values.notifyCustomer,
              }
              await mutation.mutateAsync(payload)
              methods.reset(defaultValues)
              onOpenChange(false)
            } catch (failure) {
              setError(getApiErrorMessage(failure, t('loyalty.customer.adjustment.feedback.error')))
              applyApiValidationErrors(failure, methods.setError, { notify_customer: 'notifyCustomer' })
            } finally {
              submissionLock.current = false
            }
          }}
        >
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <AdjustmentFields pending={mutation.isPending} />
        </FormWrapper>
      </DialogContent>
    </Dialog>
  )
}
