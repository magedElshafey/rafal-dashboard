import { useAffiliateAccess } from '../config/affiliate-access'
import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
import { affiliatePayoutsService } from '../api/affiliate-review.service'
import {
  isAffiliatePayoutDecisionReady,
  isAffiliatePayoutFeatureEnabled,
  isAffiliateFeatureEnabled,
} from '../config/affiliate-feature'
import { isValidPayoutDate, payoutToday } from '../schemas/affiliate-payout.schema'

type Values = { transfer_reference: string; transferred_at: string; reason: string }
function Decision({ id, mode, onClose }: { id: number; mode: 'paid' | 'reject'; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const lock = useRef(false)
  const [ambiguous, setAmbiguous] = useState(false)
  const schema = useMemo(
    () =>
      yup.object({
        transfer_reference:
          mode === 'paid'
            ? yup
                .string()
                .trim()
                .required(t('affiliates.payouts.referenceBounds'))
                .min(3, t('affiliates.payouts.referenceBounds'))
                .max(50, t('affiliates.payouts.referenceBounds'))
            : yup.string().defined(),
        transferred_at:
          mode === 'paid'
            ? yup.string().defined().test('date', t('affiliates.payouts.dateInvalid'), isValidPayoutDate)
            : yup.string().defined(),
        reason:
          mode === 'reject'
            ? yup
                .string()
                .trim()
                .required(t('affiliates.applications.reasonBounds'))
                .min(10, t('affiliates.applications.reasonBounds'))
                .max(250, t('affiliates.applications.reasonBounds'))
            : yup.string().defined(),
      }),
    [mode, t]
  )
  const reconcile = async (epoch: number | undefined) => {
    if (epoch !== getQueryClientAuthBoundaryEpoch()) return
    const keys = [
      ['affiliates', 'payouts'],
      ['affiliates', 'list'],
      ['affiliates', 'detail'],
    ]
    await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })))
    if (epoch !== getQueryClientAuthBoundaryEpoch()) return
    await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })))
  }
  const mutation = useMutation({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: (values: Values) =>
      mode === 'paid'
        ? affiliatePayoutsService.paid(id, {
            transfer_reference: values.transfer_reference,
            transferred_at: values.transferred_at,
          })
        : affiliatePayoutsService.reject(id, values.reason),
    onSuccess: async (_result, _values, epoch) => {
      await reconcile(epoch)
    },
    onError: async (error, _values, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      toastApiError(error, t('apiFeedback.error'), true)
      if (isAxiosError(error) && error.response?.status === 409) await reconcile(epoch)
    },
  })
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose()
      }}
    >
      <AlertDialogContent dir={i18n.dir()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('affiliates.payouts.' + mode)}</AlertDialogTitle>
          <AlertDialogDescription>{t('affiliates.payouts.confirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormWrapper<Values>
          schema={schema}
          defaultValues={{ transfer_reference: '', transferred_at: payoutToday(), reason: '' }}
          submissionDisabled={mutation.isPending || ambiguous}
          onSubmit={async (values, methods) => {
            if (lock.current || ambiguous) return
            lock.current = true
            const epoch = getQueryClientAuthBoundaryEpoch()
            try {
              await mutation.mutateAsync(values)
              if (epoch === getQueryClientAuthBoundaryEpoch()) onClose()
            } catch (error) {
              if (epoch !== getQueryClientAuthBoundaryEpoch()) return
              applyApiValidationErrors(error, methods.setError, {}, ['transfer_reference', 'transferred_at', 'reason'])
              if (isAxiosError(error) && error.response?.status === 409) onClose()
              else if (!isAxiosError(error) || !error.response || error.response.status >= 500) setAmbiguous(true)
            } finally {
              lock.current = false
            }
          }}
        >
          {mode === 'paid' ? (
            <>
              <FormInput
                name="transfer_reference"
                label={t('affiliates.payouts.reference')}
                maxLength={50}
                required
                autoFocus
                disabled={mutation.isPending}
              />
              <FormInput
                name="transferred_at"
                label={t('affiliates.payouts.date')}
                type="date"
                max={payoutToday()}
                required
                disabled={mutation.isPending}
              />
            </>
          ) : (
            <FormInput
              name="reason"
              label={t('affiliates.fields.reason')}
              maxLength={250}
              required
              autoFocus
              disabled={mutation.isPending}
            />
          )}
          {ambiguous ? <p role="alert">{t('affiliates.payouts.ambiguous')}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>{t('affiliates.actions.cancel')}</AlertDialogCancel>
            <Button type="submit" disabled={mutation.isPending || ambiguous}>
              {t('affiliates.payouts.' + mode)}
            </Button>
          </AlertDialogFooter>
        </FormWrapper>
      </AlertDialogContent>
    </AlertDialog>
  )
}
export function AffiliatePayoutDecision({
  id,
  status,
  refreshing,
}: {
  id: number
  status: string
  refreshing: boolean
}) {
  const { t } = useTranslation()
  const canDecide = useAffiliateAccess('payoutDecision')
  const client = useQueryClient()
  const opening = useRef(false)
  const [checking, setChecking] = useState(false)
  const openDecision = async (next: 'paid' | 'reject') => {
    if (opening.current) return
    opening.current = true
    setChecking(true)
    const epoch = getQueryClientAuthBoundaryEpoch()
    try {
      const result = await client.fetchQuery({
        queryKey: ['affiliates', 'payouts', 'detail', id],
        queryFn: ({ signal }) => affiliatePayoutsService.show(id, signal),
        staleTime: 0,
        retry: false,
      })
      if (epoch === getQueryClientAuthBoundaryEpoch() && result.payout.status === 'pending') setMode(next)
    } catch (error) {
      if (epoch === getQueryClientAuthBoundaryEpoch()) toastApiError(error, t('apiFeedback.error'), true)
    } finally {
      opening.current = false
      setChecking(false)
    }
  }
  const [mode, setMode] = useState<'paid' | 'reject' | null>(null)
  if (
    !canDecide ||
    !isAffiliateFeatureEnabled ||
    !isAffiliatePayoutFeatureEnabled ||
    !isAffiliatePayoutDecisionReady ||
    status !== 'pending'
  )
    return null
  return (
    <div className="flex gap-2">
      <Button disabled={refreshing || checking} onClick={() => void openDecision('paid')}>
        {t('affiliates.payouts.paid')}
      </Button>
      <Button variant="destructive" disabled={refreshing || checking} onClick={() => void openDecision('reject')}>
        {t('affiliates.payouts.reject')}
      </Button>
      {mode ? <Decision key={mode} id={id} mode={mode} onClose={() => setMode(null)} /> : null}
    </div>
  )
}
