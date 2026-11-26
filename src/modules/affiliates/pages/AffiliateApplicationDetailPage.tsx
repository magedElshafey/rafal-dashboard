import { useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { QueryStateBoundary } from '@/components/shared/query-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Routes } from '@/routes/routes'
import { affiliateApplicationsService } from '../api/affiliate-review.service'
import { isAffiliateFeatureEnabled } from '../config/affiliate-feature'

function Decision({
  id,
  mode,
  code,
  onClose,
  onApproved,
}: {
  id: number
  mode: 'approve' | 'reject'
  code: string
  onClose: () => void
  onApproved: (id: number) => void
}) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const lock = useRef(false)
  const schema = useMemo(
    () =>
      yup.object({
        value: yup
          .string()
          .trim()
          .required(t('affiliates.validation.required'))
          .test(
            'decision',
            t(mode === 'approve' ? 'affiliates.validation.codeInvalid' : 'affiliates.applications.reasonBounds'),
            (v) => (mode === 'approve' ? /^[A-Za-z0-9]{4,20}$/.test(v) : v.length >= 10 && v.length <= 250)
          ),
      }),
    [mode, t]
  )
  const reconcile = async (epoch: number | undefined) => {
    if (epoch !== getQueryClientAuthBoundaryEpoch()) return
    await client.cancelQueries({ queryKey: ['affiliates', 'applications'] })
    if (epoch !== getQueryClientAuthBoundaryEpoch()) return
    await client.invalidateQueries({ queryKey: ['affiliates', 'applications'] })
    if (mode === 'approve' && epoch === getQueryClientAuthBoundaryEpoch())
      await client.invalidateQueries({ queryKey: ['affiliates', 'list'] })
  }
  const mutation = useMutation({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: async (value: string) => {
      if (mode === 'approve') {
        const result = await affiliateApplicationsService.approve(id, value)
        return { message: result.sms_message, smsFailed: !result.sms_sent, affiliateId: result.affiliate.id }
      }
      return { message: await affiliateApplicationsService.reject(id, value), smsFailed: false, affiliateId: null }
    },
    onSuccess: async (result, _value, epoch) => {
      await reconcile(epoch)
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      if (result.affiliateId) onApproved(result.affiliateId)
      if (result.smsFailed) toast.warning(result.message || t('affiliates.feedback.smsFailed'))
      else toast.success(result.message || t('affiliates.applications.completed'))
    },
    onError: async (error, _value, epoch) => {
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('affiliates.applications.' + mode)}</AlertDialogTitle>
          <AlertDialogDescription>{t('affiliates.applications.confirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <FormWrapper<{ value: string }>
          schema={schema}
          defaultValues={{ value: mode === 'approve' ? code : '' }}
          submissionDisabled={mutation.isPending}
          onSubmit={async (values, methods) => {
            if (lock.current) return
            lock.current = true
            try {
              await mutation.mutateAsync(values.value)
              onClose()
            } catch (error) {
              applyApiValidationErrors(error, methods.setError, { code: 'value', reason: 'value' }, ['code', 'reason'])
              if (isAxiosError(error) && error.response?.status === 409) onClose()
            } finally {
              lock.current = false
            }
          }}
        >
          <FormInput
            name="value"
            label={t(mode === 'approve' ? 'affiliates.fields.code' : 'affiliates.fields.reason')}
            maxLength={mode === 'approve' ? 20 : 250}
            disabled={mutation.isPending}
            required
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>{t('affiliates.actions.cancel')}</AlertDialogCancel>
            <Button type="submit" disabled={mutation.isPending}>
              {t('affiliates.applications.' + mode)}
            </Button>
          </AlertDialogFooter>
        </FormWrapper>
      </AlertDialogContent>
    </AlertDialog>
  )
}
function ApplicationDetails({ id }: { id: number }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null)
  const [approvedId, setApprovedId] = useState<number | null>(null)
  const query = useQuery({
    queryKey: ['affiliates', 'applications', 'detail', id],
    queryFn: ({ signal }) => affiliateApplicationsService.show(id, signal),
    enabled: isAffiliateFeatureEnabled,
    retry: false,
  })
  const app = query.data
  if (!isAffiliateFeatureEnabled) return null
  return (
    <main className="space-y-5">
      <DashboardPageHeader
        title={app?.name || t('affiliates.applications.title')}
        actions={
          <Button asChild variant="outline">
            <Link to={Routes.affiliateApplications}>{t('affiliates.applications.title')}</Link>
          </Button>
        }
      />
      <QueryStateBoundary
        loadingFallback={<Skeleton className="h-64 w-full" />}
        isLoading={query.isLoading}
        isLoadingError={query.isError && !app}
        isRefetchError={query.isRefetchError}
        isPaused={query.isPaused}
        isFetching={query.isFetching}
        hasData={Boolean(app)}
        onRetry={query.refetch}
      >
        {approvedId ? (
          <Link className="underline focus-visible:outline-ring" to={Routes.affiliateDetailPath(approvedId)}>
            {t('affiliates.detail.title')}
          </Link>
        ) : null}
        {app ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  'phone',
                  'platform',
                  'followers_range',
                  'email',
                  'account_handle',
                  'promotion_plan',
                  'rejection_reason',
                  'decided_at',
                ] as const
              ).map((field) => (
                <ResponsiveDataFact key={field} label={t('affiliates.applications.' + field)}>
                  <bdi>{app[field] || '—'}</bdi>
                </ResponsiveDataFact>
              ))}
              <ResponsiveDataFact label={t('affiliates.fields.status')}>
                {t('affiliates.reviewStatus.' + app.status)}
              </ResponsiveDataFact>
            </dl>
            <h2 className="font-semibold">{t('affiliates.applications.customer')}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(['name', 'phone', 'account_email', 'customer_since', 'orders_count'] as const).map((field) => (
                <ResponsiveDataFact key={field} label={t('affiliates.applications.' + field)}>
                  <bdi>{app.customer[field] ?? '—'}</bdi>
                </ResponsiveDataFact>
              ))}
            </dl>
            {app.suggested_code_message ? <p role="status">{app.suggested_code_message}</p> : null}
            {app.status === 'pending' ? (
              <div className="flex gap-2">
                <Button disabled={query.isFetching} onClick={() => setMode('approve')}>
                  {t('affiliates.applications.approve')}
                </Button>
                <Button variant="destructive" disabled={query.isFetching} onClick={() => setMode('reject')}>
                  {t('affiliates.applications.reject')}
                </Button>
              </div>
            ) : null}
            {mode && app.status === 'pending' ? (
              <Decision
                key={mode}
                id={id}
                mode={mode}
                code={app.proposed_code ?? ''}
                onClose={() => setMode(null)}
                onApproved={setApprovedId}
              />
            ) : null}
          </>
        ) : null}
      </QueryStateBoundary>
    </main>
  )
}

export default function AffiliateApplicationDetailPage() {
  const { t } = useTranslation()
  const { id: raw } = useParams()
  const id = Number(raw)
  if (!isAffiliateFeatureEnabled) return null
  if (!/^[1-9]\d*$/.test(raw ?? '') || !Number.isSafeInteger(id))
    return <DashboardPageHeader title={t('affiliates.detail.notFoundTitle')} />
  return <ApplicationDetails key={id} id={id} />
}
