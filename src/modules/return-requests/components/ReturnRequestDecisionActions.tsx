import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormTextArea } from '@/components/form/FormTextArea'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { useDecideReturnRequest } from '../hooks/useReturnRequests'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import type { ReturnRequest, ReturnRequestDecisionAction } from '../types/return-request.types'
import { returnRequestDecisionFeedback } from '../utils/return-request-errors'

type DecisionFormValues = { decisionNote: string }

export function ReturnRequestDecisionActions({
  request,
  refreshing = false,
}: {
  request: ReturnRequest
  refreshing?: boolean
}) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const mutation = useDecideReturnRequest(request.id)
  const [action, setAction] = useState<ReturnRequestDecisionAction | null>(null)
  const lock = useRef(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const decisionHeading = useRef<HTMLHeadingElement | null>(null)
  const pending = mutation.isPending || refreshing
  const schema = useMemo(
    () =>
      Yup.object({
        decisionNote:
          action === 'reject'
            ? Yup.string().trim().required(t('returnRequests.validation.decisionNoteRequired'))
            : Yup.string(),
      }),
    [action, t]
  )
  const feedback = mutation.error
    ? returnRequestDecisionFeedback(
        mutation.error,
        t(action === 'approve' ? 'returnRequests.feedback.approveError' : 'returnRequests.feedback.rejectError')
      )
    : null

  if (request.status !== 'pending') return null

  const open = (nextAction: ReturnRequestDecisionAction, button: HTMLButtonElement) => {
    if (pending || lock.current || action) return
    trigger.current = button
    decisionHeading.current = button.closest('section')?.querySelector('h2') ?? null
    mutation.reset()
    setAction(nextAction)
  }

  const submit = async (values: DecisionFormValues, methods: UseFormReturn<DecisionFormValues>) => {
    const state = client.getQueryState<ReturnRequest>(returnRequestsKeys.detail(request.id))
    if (
      !action ||
      pending ||
      lock.current ||
      state?.fetchStatus !== 'idle' ||
      state.status === 'error' ||
      state.isInvalidated ||
      state.data?.status !== 'pending'
    )
      return
    lock.current = true
    try {
      await mutation.mutateAsync({ action, decisionNote: values.decisionNote })
      methods.reset()
      setAction(null)
    } catch (error) {
      const nextFeedback = returnRequestDecisionFeedback(
        error,
        t(action === 'approve' ? 'returnRequests.feedback.approveError' : 'returnRequests.feedback.rejectError')
      )
      if (nextFeedback.decisionNoteError) {
        methods.setError('decisionNote', { type: 'server', message: nextFeedback.decisionNoteError })
      }
    } finally {
      lock.current = false
    }
  }

  const formId = `return-request-${request.id}-${action ?? 'decision'}`
  const close = () => {
    if (!mutation.isPending && !lock.current) setAction(null)
  }
  return (
    <>
      <Button disabled={pending} onClick={(event) => open('approve', event.currentTarget)}>
        {t('returnRequests.actions.approve')}
      </Button>
      <Button variant="destructive" disabled={pending} onClick={(event) => open('reject', event.currentTarget)}>
        {t('returnRequests.actions.reject')}
      </Button>
      <Dialog
        open={action !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) close()
        }}
      >
        <DialogContent
          showCloseButton={false}
          dir={t('returnRequests.direction')}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            const target =
              trigger.current?.isConnected && !trigger.current.disabled ? trigger.current : decisionHeading.current
            if (target?.isConnected) {
              event.preventDefault()
              if (target === decisionHeading.current) target.tabIndex = -1
              target.focus()
            }
          }}
        >
          <DialogTitle>
            {t(
              action === 'approve'
                ? 'returnRequests.actions.confirmApproval'
                : 'returnRequests.actions.confirmRejection'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              action === 'approve'
                ? 'returnRequests.actions.approveDescription'
                : 'returnRequests.actions.rejectDescription',
              { id: request.id }
            )}
          </DialogDescription>
          <FormWrapper<DecisionFormValues>
            key={action}
            schema={schema}
            defaultValues={{ decisionNote: '' }}
            formId={formId}
            submissionDisabled={pending}
            onSubmit={submit}
          >
            <FormTextArea
              name="decisionNote"
              label={t('returnRequests.fields.decisionNote')}
              placeholder={t(
                action === 'reject'
                  ? 'returnRequests.actions.requiredDecisionNote'
                  : 'returnRequests.actions.optionalDecisionNote'
              )}
              required={action === 'reject'}
              disabled={pending}
              autoFocus
              onChange={() => mutation.reset()}
            />
          </FormWrapper>
          {refreshing ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t('returnRequests.workspace.freshnessRequired')}
            </p>
          ) : null}
          {feedback ? (
            <p role="alert" className="text-sm text-destructive">
              {feedback.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={mutation.isPending} onClick={close}>
              {t('returnRequests.actions.cancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant={action === 'reject' ? 'destructive' : 'default'}
              disabled={pending}
            >
              {t(
                mutation.isPending
                  ? 'returnRequests.actions.submitting'
                  : action === 'approve'
                    ? 'returnRequests.actions.confirmApproval'
                    : 'returnRequests.actions.confirmRejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
